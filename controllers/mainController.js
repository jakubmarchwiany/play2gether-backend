const User = require("../models/user");

const jwt = require("jsonwebtoken");

const { getToken, COOKIE_OPTIONS, getRefreshToken } = require("../authenticate");

module.exports.getUserDate = async (req, res, next) => {
    let user = await User.findById(req.user.id, { authStrategy: 0, refreshToken: 0 });

    res.send(user);
};

module.exports.registerUser = (req, res, next) => {
    console.log("register");
    if (!req.body.firstName) {
        res.statusCode = 500;
        res.send({
            name: "FirstNameError",
            message: "The first name is required",
        });
    } else {
        User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
            if (err) {
                res.statusCode = 500;
                res.send(err);
            } else {
                user.firstName = req.body.firstName;
                user.lastName = req.body.lastName;
                user.type = "user";
        
                user.image = {
                    url: "https://res.cloudinary.com/kvbik/image/upload/v1652121848/Play2Gether/defUser_yxrj4x.png",
                    id: "def",
                };

                const token = getToken({ _id: user._id });
                const refreshToken = getRefreshToken({ _id: user._id });
                user.refreshToken.push({ refreshToken });
                user.save((err, user) => {
                    if (err) {
                        res.statusCode = 500;
                        res.send(err);
                    } else {
                        res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
                        res.send({ token, user });
                    }
                });
            }
        });
    }
};

module.exports.loginUser = (req, res, next) => {
    const token = getToken({ _id: req.user._id });
    const refreshToken = getRefreshToken({ _id: req.user._id });
    User.findById(req.user._id).then(
        (user) => {
            user.refreshToken.push({ refreshToken });
            user.save((err, user) => {
                if (err) {
                    res.statusCode = 500;
                    res.send(err);
                } else {
                    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
                    res.send({ token, user });
                }
            });
        },
        (err) => next(err)
    );
};

module.exports.refreshToken = (req, res, next) => {
    const { signedCookies = {} } = req;
    const { refreshToken } = signedCookies;

    if (refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const userId = payload._id;
            User.findOne({ _id: userId }).then(
                (user) => {
                    if (user) {
                        // Find the refresh token against the user record in database
                        const tokenIndex = user.refreshToken.findIndex(
                            (item) => item.refreshToken === refreshToken
                        );

                        if (tokenIndex === -1) {
                            res.statusCode = 401;
                            res.send("Unauthorized");
                        } else {
                            const token = getToken({ _id: userId });
                            // If the refresh token exists, then create new one and replace it.
                            const newRefreshToken = getRefreshToken({ _id: userId });
                            user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken };
                            user.save((err, user) => {
                                if (err) {
                                    res.statusCode = 500;
                                    res.send(err);
                                } else {
                                    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
                                    res.statusCode = 200;
                                    res.send({ token, user });
                                }
                            });
                        }
                    } else {
                        res.statusCode = 401;
                        res.send("Unauthorized");
                    }
                },
                (err) => next(err)
            );
        } catch (err) {
            res.statusCode = 401;
            res.send("Unauthorized");
        }
    } else {
        res.statusCode = 401;
        res.send("Unauthorized");
    }
};

module.exports.logoutUser = (req, res, next) => {
    const { signedCookies = {} } = req;
    const { refreshToken } = signedCookies;

    // console.log(req)
    User.findById(req.user._id).then(
        (user) => {
            const tokenIndex = user.refreshToken.findIndex(
                (item) => item.refreshToken === refreshToken
            );

            if (tokenIndex !== -1) {
                user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove();
            }

            user.save((err, user) => {
                if (err) {
                    res.statusCode = 500;
                    res.send(err);
                } else {
                    res.clearCookie("refreshToken", COOKIE_OPTIONS);
                    res.send({ success: true });
                }
            });
        },
        (err) => next(err)
    );
};

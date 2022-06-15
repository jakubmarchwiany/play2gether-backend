const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
require("./utils/connectdb");

require("./strategies/JwtStrategy");
require("./strategies/LocalStrategy");
require("./authenticate");

const MainRoutes = require("./routes/mainRoutes");
const UserRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const whitelist = process.env.WHITELISTED_DOMAINS ? process.env.WHITELISTED_DOMAINS.split(",") : [];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },

    credentials: true,
};

app.use(cors(corsOptions));

app.use(passport.initialize());

app.use("/", MainRoutes);
app.use("/user", UserRoutes);

app.get("/", function (req, res) {
    res.send({ status: "success" });
});

const server = app.listen(process.env.PORT || 8081, function () {
    const port = server.address().port;

    console.log("App started at port:", port);
});

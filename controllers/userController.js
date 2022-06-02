const Place = require("../models/place");
const Event = require("../models/event");
const User = require("../models/user");

const { cloudinary } = require("../cloud");
const { findById } = require("../models/place");

// const napraw = async () => {
//     let image = {
//         url: "https://res.cloudinary.com/kvbik/image/upload/v1652121848/Play2Gether/defUser_yxrj4x.png",
//         id: "def",
//     };
//     await User.updateMany({}, { $set: { image: image } });

//     console.log("sieam");
// };

// napraw();

module.exports.setPremium = async (req, res, next) => {
    try {
        let { id } = req.user;
        await User.findByIdAndUpdate(id, { $set: { type: "premium" } });
        res.statusCode = 200;
        res.send();
    } catch (error) {
        res.statusCode = 500;
        res.send();
    }
};

module.exports.updateUser = async (req, res, next) => {
    let { firstName, lastName } = req.body;
    let { id } = req.user;

    try {
        await User.findByIdAndUpdate(id, { $set: { firstName, lastName } });
        res.statusCode = 200;
        res.send();
    } catch (error) {
        res.statusCode = 500;
        res.send(error);
    }
};

module.exports.updateUserImage = async (req, res, next) => {
    try {
        const fileStr = req.body.data;
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            upload_preset: "ml_default",
            folder: "Play2Gether",
        });

        let user = await User.findById(req.user.id);

        if (user.image) {
            await cloudinary.uploader.destroy(user.image.id);
        }

        let image = { url: uploadResponse.url, id: uploadResponse.public_id };
        await User.findByIdAndUpdate(req.user.id, { $set: { image: image } });

        res.json({ msg: "yaya" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: "Something went wrong" });
    }
};

module.exports.newPlace = async (req, res, next) => {
    let { name, description,sports } = req.body;
    let { longitude, latitude } = req.body.location;

    if (!name || !description || !longitude || !latitude) {
        res.statusCode = 500;
        res.send();
    } else {
        try {
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);

            let geometry = { type: "Point", coordinates: [longitude, latitude] };

            let place = new Place({
                status: "inactive",
                name,
                owner: req.user.id,
                description,
                sports,
                geometry,
            });

            console.log(req.body)

            await User.findByIdAndUpdate(req.user.id, { $push: { myPlaces: place } });
            await place.save();
            res.statusCode = 200;
            res.send();
        } catch (error) {
            res.statusCode = 500;
            res.send();
        }
    }
};

module.exports.getPlaces = async (req, res, next) => {
    let places = await Place.find({status: "active"}, { status: 0 }).populate("events");
    res.send(places);
};

module.exports.getInactivePlaces = async (req, res, next) => {
    let places = await Place.find({status: "inactive"}, { status: 0 }).populate("events");
    res.send(places);
};

module.exports.getPlace = async (req, res, next) => {
    let { id } = req.params;

    let place = await Place.findById(id).populate("events");
    res.send(place);
};

module.exports.newEvent = async (req, res, next) => {
    let { id: placeId } = req.params;
    let { id: ownerId } = req.user;

    let { startDate, maxPeople, sport } = req.body;

    console.log(sport)

    try {
        if (maxPeople.length == 0) {
            var newEvent = new Event({
                owner: ownerId,
                place: placeId,
                sport: sport,
                date: new Date(startDate),
                signedUp: ownerId,
            });
        } else {
            maxPeople = parseInt(maxPeople);
            var newEvent = new Event({
                owner: ownerId,
                place: placeId,
                sport:sport,
                date: new Date(startDate),
                signedUp: ownerId,
                maxSignedUp: maxPeople,
            });
        }
        await newEvent.save();
        await Place.findByIdAndUpdate(placeId, {
            $push: { events: newEvent },
        });
        res.statusCode = 200;
        res.send();
    } catch (error) {
        res.statusCode = 500;
        res.send(error);
    }
};

module.exports.joinToEvent = async (req, res, next) => {
    let { id: eventId } = req.params;

    let { id: userId } = req.user;

    let is = await Event.exists({ _id: eventId, signedUp: userId });

    if (is) {
        res.statusCode = 500;
        res.send({
            message: "Nie możesz dołączyć do wydarzenia w którym bierzesz udziału",
        });
    } else {
        await Event.findByIdAndUpdate(eventId, { $push: { signedUp: userId } });
        res.statusCode = 200;
        res.send();
    }
};

module.exports.leaveFromEvent = async (req, res, next) => {
    let { id: eventId } = req.params;
    let { id: userId } = req.user;

    let is = await Event.exists({ _id: eventId, signedUp: userId });

    if (is) {
        await Event.findByIdAndUpdate(eventId, { $pull: { signedUp: userId } });
        res.statusCode = 200;
        res.send({
            message: "Wyszedłeś z wydarzenia",
        });
    } else {
        res.statusCode = 500;
        res.send({
            message: "Nie możesz wyjść z wydarzenia w którym nie bierzesz udziału",
        });
    }
};

module.exports.getEvent = async (req, res, next) => {
    let { id: eventId } = req.params;

    try {
        let event = await Event.findById(eventId).populate({
            path: "signedUp",
            select: "firstName lastName image",
        });
        console.log(event);
        res.statusCode = 200;
        res.send(event);
    } catch (error) {
        res.statusCode = 500;
        res.send({
            message: "Błąd",
        });
    }
};

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

const cloudinaryImageUploadMethod = async (file) => {
    return new Promise((resolve) => {
        cloudinary.uploader.upload(
            file,
            { upload_preset: "ml_default", folder: "Play2Gether/Places" },
            (err, res) => {
                if (err) return res.status(500).send("upload image error");
                resolve({ url: res.secure_url, id: res.public_id });
            }
        );
    });
};

module.exports.newPlace = async (req, res, next) => {
    let { name, description, sports } = req.body;
    let { longitude, latitude } = req.body.location;
    let { data: images } = req.body;

    if (!name || !description || !longitude || !latitude) {
        res.statusCode = 500;
        res.send();
    } else {
        try {
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);

            let geometry = { type: "Point", coordinates: [longitude, latitude] };

            const infoImages = [];
            for (const image of images) {
                const { dataURL } = image;
                const infoImage = await cloudinaryImageUploadMethod(dataURL);
                infoImages.push(infoImage);
            }

            console.log(infoImages);

            let place = new Place({
                status: "inactive",
                name,
                owner: req.user.id,
                description,
                images: infoImages,
                sports,
                geometry,
            });

            console.log(place);

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
    let places = await Place.find({ status: "active" }, { status: 0 }).populate("events");
    res.send(places);
};

module.exports.getInactivePlaces = async (req, res, next) => {
    let places = await Place.find({ status: "inactive" }, { status: 0 });
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

    console.log(sport);

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
                sport: sport,
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

module.exports.deleteEvent = async (req, res, next) => {
    let { id: eventId } = req.params;

    let event = await Event.findById(eventId);
    if (req.user.id != event.owner.toString()) {
        res.statusCode = 500;
        res.send();
    } else {
        await Event.findByIdAndDelete(eventId);
        await Place.findByIdAndUpdate(event.place, { $pull: { events: eventId } });

        res.statusCode = 200;
        res.send();
    }
};

module.exports.getEvent = async (req, res, next) => {
    let { id: eventId } = req.params;

    try {
        let event = await Event.findById(eventId).populate({
            path: "signedUp",
            select: "firstName lastName image type",
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

module.exports.adminAcceptedPlace = async (req, res, next) => {
    let { id, name, description, sports } = req.body;
    let { longitude, latitude } = req.body.location;

    try {
        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        let geometry = { type: "Point", coordinates: [longitude, latitude] };

        await Place.findByIdAndUpdate(id, {
            $set: { status: "active", name, description, sports, geometry },
        });
        res.statusCode = 200;
        res.send();
    } catch (error) {
        res.statusCode = 500;
        res.send();
    }
};

module.exports.adminDeniedPlace = async (req, res, next) => {
    let { id } = req.body;

    try {
        let place = await Place.findByIdAndDelete(id);
        await User.findByIdAndUpdate(place.owner, { $pull: { myPlaces: id } });

        res.statusCode = 200;
        res.send();
    } catch (error) {
        res.statusCode = 500;
        res.send();
    }
};

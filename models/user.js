const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

const Session = new Schema({
    refreshToken: {
        type: String,
        default: "",
    },
});

const User = new Schema({
    type: {
        type: String,
        enum: ["admin", "user","premium"],
    },
    firstName: {
        type: String,
        default: "",
    },
    lastName: {
        type: String,
        default: "",
    },
    image: {
        url: String,
        id: String,
    },
    myPlaces: [
        {
            type: Schema.Types.ObjectId,
            ref: "Place",
        },
    ],
    activeEvents: [
        {
            type: Schema.Types.ObjectId,
            ref: "Event",
        },
    ],
    authStrategy: {
        type: String,
        default: "local",
    },
    refreshToken: {
        type: [Session],
    },
});

//Remove refreshToken from the response
User.set("toJSON", {
    transform: function (doc, ret, options) {
        delete ret.refreshToken;
        return ret;
    },
});

User.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", User);

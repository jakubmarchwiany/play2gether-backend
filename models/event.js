const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Event = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    place:{
        type: Schema.Types.ObjectId,
        ref: "Place",
    },
    sport:String,
    date: Date,
    signedUp: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    maxSignedUp: {
        type: Number,
    },
});


module.exports = mongoose.model("Event", Event);
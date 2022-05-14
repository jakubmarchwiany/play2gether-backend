const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Place = new Schema({
    status: {
        type: String,
        enum: ["active", "inactive"],
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    name: {
        type: String,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    sports:[String],
    events: [
        {
            type: Schema.Types.ObjectId,
            ref: "Event",
        },
    ],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
});


module.exports = mongoose.model("Place", Place);
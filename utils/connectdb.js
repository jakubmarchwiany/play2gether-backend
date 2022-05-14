const mongoose = require("mongoose");
const url = process.env.MONGO_DB_CONNECTION_STRING;

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// #####################################################################

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

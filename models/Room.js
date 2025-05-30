const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    beds: { type: Number, required: true },
    isolationLevel: String
});

module.exports = mongoose.model("Room", roomSchema);

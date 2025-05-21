const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  illness: String,
  allergies: String,
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" } 
});

module.exports = mongoose.model("Patient", patientSchema);

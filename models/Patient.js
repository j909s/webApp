const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  illness: String,
  allergies: String,
});

module.exports = mongoose.model("Patient", patientSchema);

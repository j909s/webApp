const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const MongoStore = require("connect-mongo");
const User = require("./models/User");

const app = express();

mongoose.connect("mongodb://20.0.153.128:10999/jadeDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  illness: String,
  allergies: String,
});
const Patient = mongoose.model("Patient", patientSchema);

// app.get("/", (req, res) => res.redirect("/patients"));

function isAuthenticated(req, res, next) {
    if (req.session.userId) return next();
    res.redirect("/login");
}

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.redirect("/login");
    } catch (err) {
        res.status(500).send("Registration failed.");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Incorrect password");

    req.session.userId = user._id;
    res.redirect("/students");
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get("/patients", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.render("patients", { patients });
  } catch {
    res.status(500).send("Error fetching patients");
  }
});

app.get("/patient/new", (req, res) => res.render("new_patient"));

app.post("/patient", async (req, res) => {
  try {
    await new Patient(req.body).save();
    res.redirect("/patients");
  } catch {
    res.status(500).send("Error adding patient");
  }
});

app.get("/patient/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).send("Not Found");
    res.render("patient", { patient });
  } catch {
    res.status(500).send("Error fetching patient");
  }
});

app.get("/patient/:id/edit", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).send("Not Found");
    res.render("edit_patient", { patient });
  } catch {
    res.status(500).send("Error");
  }
});

app.put("/patient/:id", async (req, res) => {
  try {
    await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect("/patients");
  } catch {
    res.status(500).send("Error updating");
  }
});

app.delete("/patient/:id", async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.redirect("/patients");
  } catch {
    res.status(500).send("Error deleting");
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(3000, "0.0.0.0", () => {
    console.log("Server is running on port 3000");
  });
}
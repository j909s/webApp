const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const app = express();

mongoose.connect("mongodb://20.0.153.128:10999/studentsnDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  course: String,
});
const Student = mongoose.model("Student", studentSchema);

app.get("/", (req, res) => res.redirect("/students"));

app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.render("students", { students });
  } catch {
    res.status(500).send("Error fetching students");
  }
});

app.get("/student/new", (req, res) => res.render("new_student"));

app.post("/student", async (req, res) => {
  try {
    await new Student(req.body).save();
    res.redirect("/students");
  } catch {
    res.status(500).send("Error adding student");
  }
});

app.get("/student/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send("Not Found");
    res.render("student", { student });
  } catch {
    res.status(500).send("Error fetching student");
  }
});

app.get("/student/:id/edit", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send("Not Found");
    res.render("edit_student", { student });
  } catch {
    res.status(500).send("Error");
  }
});

app.put("/student/:id", async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect("/students");
  } catch {
    res.status(500).send("Error updating");
  }
});

app.delete("/student/:id", async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect("/students");
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
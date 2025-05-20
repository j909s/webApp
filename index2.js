const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const app = express();

mongoose.connect("mongodb://20.0.153.128:10999/KieranDB")
  .then(() => console.log("MongoDB Connected to KieranDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => res.redirect("/users"));

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.render("users", { users });
  } catch {
    res.status(500).send("Error fetching students");
  }
});

app.get("/user/new", (req, res) => res.render("new_user"));

app.post("/users", async (req, res) => {
  try {
    await new User(req.body).save();
    res.redirect("/users");
  } catch {
    res.status(500).send("Error adding student");
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("Not Found");
    res.render("user", { user });
  } catch {
    res.status(500).send("Error fetching student");
  }
});

app.get("/user/:id/edit", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("Not Found");
    res.render("edit_user", { user });
  } catch {
    res.status(500).send("Error");
  }
});

app.put("/user/:id", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.redirect("/users");
  } catch {
    res.status(500).send("Error updating");
  }
});

app.delete("/user/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/users");
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
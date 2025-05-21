const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const MongoStore = require("connect-mongo");
const User = require("./models/User");
const Room = require("./models/Room");
const Patient = require("./models/Patient");

const app = express();

mongoose.connect("mongodb://20.0.153.128:10999/jadeDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.use(session({
    secret: "secretKey123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://20.0.153.128:10999/jadeDB" })
}));



app.get("/", (req, res) => res.redirect("/login"));

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
    try{
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) return res.status(500).send("User not found");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(500).send("Incorrect password");
        req.session.userId = user._id;
        res.redirect("/patients");
    }
    catch {
    res.status(500).send("Error login failed");
  }
    
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get("/patients", isAuthenticated,async (req, res) => {
  try {
    const patients = await Patient.find().populate("room");
    res.render("patients", { patients });
  } catch {
    res.status(500).send("Error fetching patients");
  }
});

app.get("/patient/new", isAuthenticated, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.render("new_patient", { rooms });
  } catch {
    res.status(500).send("Error fetching rooms");
  }
});

app.post("/patient", async (req, res) => {
  try {
    const { name, age, illness, allergies, room } = req.body;

    // Step 1: Get the room by ID
    const selectedRoom = await Room.findById(room);
    if (!selectedRoom) {
      return res.status(400).send("Room not found.");
    }

    const assignedCount = await Patient.countDocuments({ room: room });

    if (assignedCount >= selectedRoom.beds) {
      return res.status(400).send("This room is full and cannot accept more patients.");
      
    }
    const newPatient = new Patient({ name, age, illness, allergies, room });
    await newPatient.save();

    res.redirect("/patients");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding patient.");
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


app.get("/rooms", isAuthenticated, async (req, res) => {
  try {
    const rooms = await Room.find().sort("number");

    // For each room, attach its patients
    const roomsWithPatients = await Promise.all(
      rooms.map(async (room) => {
        const patients = await Patient.find({ room: room._id });
        return {
          ...room.toObject(),
          patients
        };
      })
    );

    res.render("rooms", { rooms: roomsWithPatients });
  } catch (err) {
    res.status(500).send("Error fetching rooms");
  }
});

app.post("/rooms", async (req, res) => {
  try {
    await new Room(req.body).save();
    res.redirect("/rooms");
  } catch {
    res.status(500).send("Error adding patient");
  }
});

app.get("/rooms/new", isAuthenticated, async (req, res) =>res.render("new_room"));

app.get("/patients/isolation", isAuthenticated, async (req, res) => {
  try {
    const patients = await Patient.find().populate("room");

    // Define mapping of illness → isolation level
    const isolationMap = {
      "COVID-19": "High",
      "Epiglottitis": "High",
      "E. coli": "Hight",
      "Tuberculosis": "High",
      "Pneumonia": "High",
      "Ebola": "High",
      "MRSA": "Medium",
      "C. diff": "Medium",
      "Hepatitis B": "Medium",
      "Salmonella": "Medium",
      "Influenza": "Low",
      "Cold": "Low",
      "Chickenpox": "Low",
      "Measles": "Low",
      "RotaVirus": "Low",
      "Whooping cough": "Low",
      "Scabies": "Low"
    };

    // Organize patients by isolation priority
    const isolationLevels = {
      High: [],
      Medium: [],
      Low: [],
      None: []
    };

    patients.forEach(patient => {
      const illness = patient.illness?.trim();
      const priority = isolationMap[illness] || "None";
      isolationLevels[priority].push(patient);
    });

    res.render("isolation_priority", { isolationLevels });
  } catch {
    res.status(500).send("Error classifying patients");
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(3000, "0.0.0.0", () => {
    console.log("Server is running on port 3000");
  });
}
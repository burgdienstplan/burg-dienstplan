const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// Routen für Lift-Management
router.get("/status", async (req, res) => {
  try {
    const lift = await Lift.findOne();
    res.json(lift.status);
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Abrufen des Lift-Status" });
  }
});

router.post("/maintenance/schedule", async (req, res) => {
  try {
    const { maintenanceType, preferredDate } = req.body;
    const scheduled = await ScheduleIntegration.scheduleMaintenance(
      maintenanceType,
      preferredDate
    );
    res.json(scheduled);
  } catch (error) {
    res.status(500).json({ error: "Fehler bei der Wartungsplanung" });
  }
});

router.post("/maintenance/emergency", async (req, res) => {
  try {
    const { issue } = req.body;
    const emergency = await ScheduleIntegration.scheduleEmergencyMaintenance(issue);
    res.json(emergency);
  } catch (error) {
    res.status(500).json({ error: "Fehler bei der Notfallwartungsplanung" });
  }
});

router.get("/maintenance/schedule", async (req, res) => {
  try {
    const tasks = await Task.find({
      type: { $in: ["lift-maintenance", "lift-emergency"] }
    })
    .populate("assignedTo", "name")
    .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Abrufen der Wartungen" });
  }
});

router.put("/maintenance/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Aufgabe nicht gefunden" });
    }

    task.status = status;
    if (notes) {
      task.notes.push({
        content: notes,
        createdAt: new Date(),
        createdBy: req.user._id
      });
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Aktualisieren des Status" });
  }
});

// Lift Schema
const liftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['aktiv', 'wartung', 'inaktiv'], default: 'aktiv' },
  wartungsDatum: Date,
  naechsteWartung: Date
});

const Lift = mongoose.model('Lift', liftSchema);

// API-Routen
app.use("/.netlify/functions/lift-management", router);

// Handler für Netlify Functions
exports.handler = serverless(app);

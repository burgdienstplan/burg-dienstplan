const express = require('express');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const cors = require('cors');
const User = require('./models/User');
const Chat = require('./models/Chat');
const Dienst = require('./models/Dienst');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Verbindung
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { benutzername, passwort } = req.body;
    const user = await User.findOne({ benutzername, passwort });
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Ungültige Anmeldedaten' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server-Fehler' });
  }
});

// Chat Routes
app.get('/chat', async (req, res) => {
  try {
    const messages = await Chat.find().sort({ zeitstempel: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Laden der Nachrichten' });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { von, nachricht } = req.body;
    const newMessage = new Chat({ von, nachricht });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Speichern der Nachricht' });
  }
});

// Dienst Routes
app.get('/dienste', async (req, res) => {
  try {
    const { start, end, mitarbeiterId } = req.query;
    let query = {};
    
    // Filter nach Datum
    if (start && end) {
      query.datum = { $gte: start, $lte: end };
    }
    
    // Filter nach Mitarbeiter (optional)
    if (mitarbeiterId) {
      query.mitarbeiterId = mitarbeiterId;
    }
    
    const dienste = await Dienst.find(query).sort({ datum: 1 });
    res.json(dienste);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Laden der Dienste' });
  }
});

app.post('/dienste', async (req, res) => {
  try {
    const { mitarbeiterId, datum, schicht, position, status, erstelltVon } = req.body;
    const newDienst = new Dienst({
      mitarbeiterId,
      datum,
      schicht,
      position,
      status,
      erstelltVon
    });
    await newDienst.save();
    res.status(201).json(newDienst);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Speichern des Dienstes' });
  }
});

app.put('/dienste/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const dienst = await Dienst.findByIdAndUpdate(id, update, { new: true });
    if (dienst) {
      res.json(dienst);
    } else {
      res.status(404).json({ message: 'Dienst nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Dienstes' });
  }
});

// User Route
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Laden der Benutzer' });
  }
});

module.exports.handler = serverless(app);

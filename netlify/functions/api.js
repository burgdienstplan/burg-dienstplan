const express = require('express');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const cors = require('cors');
const User = require('./models/User');
const Chat = require('./models/Chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Verbindung
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/dienstplan?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Schemas
const dienstAnfrageSchema = new mongoose.Schema({
  mitarbeiterId: String,
  datum: String,
  position: String,
  status: {
    type: String,
    enum: ['offen', 'genehmigt', 'abgelehnt'],
    default: 'offen'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DienstAnfrage = mongoose.model('DienstAnfrage', dienstAnfrageSchema);

// API Routes
app.get('/api/dienstanfragen', async (req, res) => {
  try {
    const anfragen = await DienstAnfrage.find();
    res.json(anfragen);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/dienstanfragen', async (req, res) => {
  try {
    const anfrage = new DienstAnfrage(req.body);
    const neuAnfrage = await anfrage.save();
    res.status(201).json(neuAnfrage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/dienstanfragen/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const anfrage = await DienstAnfrage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json(anfrage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

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

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'mitarbeiter', 'museumsfuehrer'], required: true },
  name: String,
  email: String
});

// Dienstplan Schema
const dienstSchema = new mongoose.Schema({
  datum: { type: Date, required: true },
  bereich: { type: String, required: true },
  mitarbeiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'geplant' },
  zeit: {
    von: String,
    bis: String
  }
});

const User = mongoose.model('User', userSchema);
const Dienst = mongoose.model('Dienst', dienstSchema);

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Burg Hochosterwitz API' });
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: 'Benutzer nicht gefunden' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Falsches Passwort' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, role: user.role, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// Admin Benutzer erstellen
app.post('/setup', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin existiert bereits' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'Administrator',
      email: 'admin@burg.at'
    });

    await admin.save();
    res.json({ message: 'Admin erstellt' });
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// Dienstplan Routes
app.get('/dienstplan', async (req, res) => {
  try {
    const dienste = await Dienst.find().populate('mitarbeiter');
    res.json(dienste);
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

app.post('/dienstplan', async (req, res) => {
  try {
    const dienst = new Dienst(req.body);
    await dienst.save();
    res.json(dienst);
  } catch (error) {
    res.status(500).json({ message: 'Server Fehler' });
  }
});

// Netlify Function Handler
const handler = serverless(app);
exports.handler = async (event, context) => {
  // Füge den Pfad zur Event-Path hinzu
  if (!event.path.startsWith('/.netlify/functions/')) {
    event.path = `/.netlify/functions/server${event.path}`;
  }
  return handler(event, context);
};

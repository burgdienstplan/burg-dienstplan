require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const User = require('./models/user');

const app = express();

// JSON Parser
app.use(express.json());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// Einfache Session-Simulation
let loggedInUser = null;

// API-Route
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API ist online',
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'verbunden' : 'getrennt'
  });
});

// Login-Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Benutzer in DB suchen
    const user = await User.findOne({ username, active: true });
    
    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }
    
    // Passwort prüfen
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }
    
    // Login-Zeit aktualisieren
    user.lastLogin = new Date();
    await user.save();
    
    // Session speichern
    loggedInUser = {
      id: user._id,
      username: user.username,
      role: user.role,
      name: user.name
    };
    
    res.json({ 
      message: 'Login erfolgreich',
      user: loggedInUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server-Fehler beim Login' });
  }
});

// Auth-Check Route
app.get('/api/check-auth', (req, res) => {
  if (loggedInUser) {
    res.json({ user: loggedInUser });
  } else {
    res.status(401).json({ message: 'Nicht eingeloggt' });
  }
});

// Logout-Route
app.post('/api/logout', (req, res) => {
  loggedInUser = null;
  res.json({ message: 'Erfolgreich abgemeldet' });
});

// Admin-Route: Ersten Benutzer erstellen
app.post('/api/setup', async (req, res) => {
  try {
    // Prüfen ob bereits Benutzer existieren
    const count = await User.countDocuments();
    
    if (count > 0) {
      return res.status(400).json({ message: 'Setup bereits durchgeführt' });
    }
    
    // Admin-Benutzer erstellen
    const admin = new User({
      username: 'admin',
      password: 'Ratzendorf55',
      role: 'kastellan',
      name: 'Administrator',
      email: 'admin@burghochosterwitz.com',
      address: {
        street: 'Hochosterwitz 1',
        city: 'Launsdorf',
        zip: '9314'
      }
    });
    
    await admin.save();
    
    res.json({ 
      message: 'Admin-Benutzer erstellt',
      username: admin.username
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ message: 'Fehler beim Setup' });
  }
});

// Catch-all Route
app.get('*', (req, res) => {
  res.json({ 
    error: 'Route nicht gefunden',
    path: req.path
  });
});

module.exports.handler = serverless(app);

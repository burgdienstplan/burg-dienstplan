require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const app = express();

// JSON Parser
app.use(express.json());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Fehler:', err));

// Status-Route
app.get('/api/status', async (req, res) => {
  try {
    // MongoDB Status prüfen
    const dbStatus = mongoose.connection.readyState === 1 ? 'verbunden' : 'getrennt';
    
    // Benutzer zählen
    const userCount = await User.countDocuments();
    
    // Admin-Benutzer suchen
    const adminExists = await User.findOne({ username: 'kastellan' });

    res.json({
      status: 'OK',
      mongodb: {
        status: dbStatus,
        uri: process.env.MONGODB_URI ? 'Konfiguriert' : 'Fehlt',
        users: userCount,
        adminExists: adminExists ? 'Ja' : 'Nein'
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET
      }
    });
  } catch (error) {
    console.error('Status-Fehler:', error);
    res.status(500).json({ 
      status: 'Fehler',
      error: error.message
    });
  }
});

// Login-Route
app.post('/api/login', async (req, res) => {
  console.log('Login-Versuch:', req.body.username);
  
  const { username, password } = req.body;
  
  try {
    // Benutzer in DB suchen
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log('Benutzer nicht gefunden:', username);
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }
    
    // Passwort prüfen
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Falsches Passwort für:', username);
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }
    
    // Login erfolgreich
    console.log('Login erfolgreich:', username);
    
    res.json({ 
      message: 'Login erfolgreich',
      user: {
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ message: 'Server-Fehler beim Login' });
  }
});

// Admin erstellen Route
app.post('/api/setup', async (req, res) => {
  try {
    // Prüfen ob bereits Benutzer existieren
    const count = await User.countDocuments();
    
    if (count > 0) {
      return res.status(400).json({ message: 'Setup bereits durchgeführt' });
    }
    
    // Admin-Benutzer erstellen
    const hashedPassword = await bcrypt.hash('BurgAdmin2025!', 10);
    const admin = new User({
      username: 'kastellan',
      password: hashedPassword,
      role: 'kastellan',
      name: 'Kastellan',
      email: 'kastellan@burghochosterwitz.at',
      active: true
    });
    
    await admin.save();
    
    res.json({ 
      message: 'Admin-Benutzer erstellt',
      username: admin.username
    });
  } catch (error) {
    console.error('Setup-Fehler:', error);
    res.status(500).json({ message: 'Fehler beim Setup' });
  }
});

// Dashboard-Route
app.get('/api/dashboard', async (req, res) => {
  try {
    const stats = {
      nextShift: 'Keine geplant',
      maintenanceCount: '0',
      activeEmployees: await User.countDocuments({ active: true })
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard-Fehler:', error);
    res.status(500).json({ message: 'Fehler beim Laden des Dashboards' });
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

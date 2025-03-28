const express = require('express');
const serverless = require('serverless-http');

const app = express();

// JSON Parser
app.use(express.json());

// Einfache Session-Simulation
let loggedInUser = null;

// API-Route
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API ist online',
    status: 'OK'
  });
});

// Login-Route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Einfache Test-Credentials
  if (username === 'admin' && password === 'Ratzendorf55') {
    // Benutzer speichern
    loggedInUser = {
      username: 'admin',
      role: 'kastellan'
    };
    
    res.json({ 
      message: 'Login erfolgreich',
      user: loggedInUser
    });
  } else {
    res.status(401).json({ 
      message: 'Ungültige Anmeldedaten'
    });
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

// Catch-all Route
app.get('*', (req, res) => {
  res.json({ 
    error: 'Route nicht gefunden',
    path: req.path
  });
});

module.exports.handler = serverless(app);

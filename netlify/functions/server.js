const express = require('express');
const serverless = require('serverless-http');

const app = express();

// JSON Parser
app.use(express.json());

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
    res.json({ 
      message: 'Login erfolgreich',
      user: {
        username: 'admin',
        role: 'kastellan'
      }
    });
  } else {
    res.status(401).json({ 
      message: 'Ungültige Anmeldedaten'
    });
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

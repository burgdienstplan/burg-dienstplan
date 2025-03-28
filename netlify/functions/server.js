const express = require('express');
const serverless = require('serverless-http');

const app = express();

// API-Route
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API ist online',
    status: 'OK'
  });
});

// Catch-all Route
app.get('*', (req, res) => {
  res.json({ 
    error: 'Route nicht gefunden',
    path: req.path
  });
});

module.exports.handler = serverless(app);

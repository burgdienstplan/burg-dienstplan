const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Nur JSON zurückgeben
app.get('/', (req, res) => {
  res.json({ 
    message: 'Willkommen auf Burg Hochosterwitz',
    status: 'Server läuft'
  });
});

module.exports.handler = serverless(app);

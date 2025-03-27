const express = require('express');
const serverless = require('serverless-http');

const app = express();

// CORS aktivieren
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Test-Route
app.get('/', (req, res) => {
  res.json({ message: 'Burg Hochosterwitz API ist online!' });
});

// Handler für Netlify Functions
module.exports.handler = serverless(app);

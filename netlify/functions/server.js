const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Einfache Test-Route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Burg Hochosterwitz</title>
        <style>
          body { font-family: Arial; margin: 40px; }
        </style>
      </head>
      <body>
        <h1>Willkommen auf Burg Hochosterwitz</h1>
        <p>Der Server läuft!</p>
      </body>
    </html>
  `);
});

// API Test-Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API läuft!' });
});

module.exports.handler = serverless(app);

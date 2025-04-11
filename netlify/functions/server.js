const mongoose = require('mongoose');

// MongoDB Verbindung
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Dienstplan Schema
const dienstSchema = new mongoose.Schema({
  datum: { type: Date, required: true },
  bereich: { type: String, enum: ['shop_eintritt', 'shop_museum', 'eintritt', 'fuehrung'], required: true },
  mitarbeiter: { type: String, required: true },
  zeit: {
    von: { type: String, required: true, default: '09:00' },
    bis: { type: String, required: true, default: '18:00' }
  }
});

const Dienst = mongoose.model('Dienst', dienstSchema);

exports.handler = async function(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // Verbinde mit MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB verbunden');

    // Route handling
    switch (event.path) {
      case '/.netlify/functions/server':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: "Burg Hochosterwitz API"
          })
        };

      case '/.netlify/functions/server/dienste':
        if (event.httpMethod === 'GET') {
          const dienste = await Dienst.find();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(dienste)
          };
        }

        if (event.httpMethod === 'POST') {
          const body = JSON.parse(event.body);
          const dienst = new Dienst(body);
          await dienst.save();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(dienst)
          };
        }

        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: 'Methode nicht erlaubt' })
        };

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Route nicht gefunden' })
        };
    }
  } catch (error) {
    console.error('Fehler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Server Fehler",
        error: error.message
      })
    };
  } finally {
    // Schließe die Verbindung
    await mongoose.disconnect();
  }
};

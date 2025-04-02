const mongoose = require('mongoose');

// MongoDB Verbindung
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Steindorfer:Ratzendorf55@cluster0.ay1oe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: String,
  email: String
});

const User = mongoose.model('User', userSchema);

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

    // Test: Liste alle User
    const users = await User.find();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Burg Hochosterwitz API",
        users: users,
        path: event.path,
        method: event.httpMethod
      })
    };
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

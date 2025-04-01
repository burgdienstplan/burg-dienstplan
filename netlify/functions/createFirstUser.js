const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async function(event, context) {
  try {
    // Verbindung zur Datenbank herstellen
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Prüfen, ob bereits Benutzer existieren
    const existingUsers = await User.find();
    if (existingUsers.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Es existieren bereits Benutzer im System.' })
      };
    }

    // Admin-Benutzer erstellen
    const hashedPassword = await bcrypt.hash('BurgAdmin2025!', 10);
    const adminUser = new User({
      username: 'kastellan',
      password: hashedPassword,
      email: 'kastellan@burghochosterwitz.at',
      role: 'kastellan',
      name: 'Kastellan',
      active: true
    });

    await adminUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Admin-Benutzer wurde erfolgreich erstellt',
        username: 'kastellan',
        password: 'BurgAdmin2025!'
      })
    };
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Interner Serverfehler beim Erstellen des Admin-Benutzers.' })
    };
  } finally {
    await mongoose.disconnect();
  }
};

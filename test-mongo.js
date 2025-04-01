require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Verbinde mit MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB erfolgreich verbunden!');
    console.log('Datenbankstatus:', mongoose.connection.readyState === 1 ? 'Verbunden' : 'Nicht verbunden');
    
    // Test: Benutzer zählen
    const User = require('./netlify/functions/models/user');
    const count = await User.countDocuments();
    console.log('Anzahl Benutzer in der Datenbank:', count);
    
  } catch (error) {
    console.error('Fehler bei der MongoDB-Verbindung:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Verbindung getrennt');
  }
}

testConnection();

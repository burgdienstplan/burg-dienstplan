const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/employee');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

exports.handler = async function(event, context) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB verbunden');
    
    // Prüfen ob Admin existiert
    const existingUser = await Employee.findOne({ username: 'admin' });
    
    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Admin existiert bereits' })
      };
    }
    
    // Admin erstellen
    const hashedPassword = await bcrypt.hash('Ratzendorf55', 10);
    
    const admin = new Employee({
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Kastellan',
      role: 'kastellan',
      isActive: true,
      email: 'admin@burghochosterwitz.com'
    });
    
    await admin.save();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Admin erfolgreich erstellt',
        username: admin.username,
        role: admin.role
      })
    };
    
  } catch (error) {
    console.error('Fehler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Fehler beim Erstellen des Admins',
        error: error.message
      })
    };
  }
};

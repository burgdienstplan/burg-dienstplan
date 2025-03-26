const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['kastellan', 'hausmeister', 'museumsfuehrer', 'mitarbeiter'],
    default: 'mitarbeiter'
  },
  isActive: { type: Boolean, default: true },
  // Für Museumsführer: Sprachen die sie sprechen
  languages: [{
    type: String,
    enum: ['deutsch', 'englisch', 'italienisch', 'französisch']
  }],
  // Für Museumsführer: Spezielle Führungen die sie anbieten können
  specialTours: [{
    type: String,
    enum: ['standard', 'historisch', 'architektur', 'kinder', 'nacht']
  }],
  positions: [{
    type: String,
    enum: ['shop_eintritt', 'eintritt', 'shop_museum', 'fuehrung']
  }]
});

module.exports = mongoose.model('Employee', employeeSchema);

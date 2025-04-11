const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['standard', 'historisch', 'architektur', 'kinder', 'nacht'],
    required: true
  },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, default: 60 }, // in Minuten
  maxParticipants: { type: Number, default: 25 },
  currentParticipants: { type: Number, default: 0 },
  language: {
    type: String,
    enum: ['deutsch', 'englisch', 'italienisch', 'französisch'],
    required: true
  },
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: { type: String },
  weather: { type: String }, // Für Wetterabhängige Planungen
  specialRequirements: { type: String }
});

// Compound index für eindeutige Führungen pro Guide und Zeitslot
tourSchema.index({ guide: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Tour', tourSchema);

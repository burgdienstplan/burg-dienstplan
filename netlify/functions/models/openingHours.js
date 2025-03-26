const mongoose = require('mongoose');

const openingHoursSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, required: true }, // Format: "HH:mm"
  closeTime: { type: String, required: true }, // Format: "HH:mm"
  isFeiertag: { type: Boolean, default: false },
  feiertagName: String,
  note: String
});

// Index für schnelle Datumssuche
openingHoursSchema.index({ date: 1 });

module.exports = mongoose.model('OpeningHours', openingHoursSchema);

const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  position: { 
    type: String,
    enum: ['shop_eintritt', 'eintritt', 'shop_museum', 'fuehrung'],
    required: true
  },
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true },   // Format: "HH:mm"
  status: {
    type: String,
    enum: ['geplant', 'bestätigt', 'abgelehnt'],
    default: 'geplant'
  },
  note: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index für schnelle Suche
shiftSchema.index({ date: 1, employee: 1 });
shiftSchema.index({ date: 1, position: 1 });

module.exports = mongoose.model('Shift', shiftSchema);

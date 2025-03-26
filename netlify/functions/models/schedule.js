const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee',
    required: true 
  },
  date: { type: Date, required: true },
  position: { 
    type: String,
    enum: ['shop_eintritt', 'eintritt', 'shop_museum', 'fuehrung'],
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected'],
    default: 'requested'
  },
  type: {
    type: String,
    enum: ['work', 'vacation'],
    default: 'work'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: { type: Date }
});

// Compound index für eindeutige Einträge pro Mitarbeiter und Tag
scheduleEntrySchema.index({ employee: 1, date: 1 }, { unique: true });

const holidaySchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['holiday', 'closed'],
    default: 'holiday'
  }
});

module.exports = {
  ScheduleEntry: mongoose.model('ScheduleEntry', scheduleEntrySchema),
  Holiday: mongoose.model('Holiday', holidaySchema)
};

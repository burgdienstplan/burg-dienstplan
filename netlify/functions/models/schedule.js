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
  type: {
    type: String,
    enum: ['work', 'vacation', 'sick', 'training'],
    default: 'work'
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected'],
    default: 'requested'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvedAt: Date,
  note: String
});

const holidaySchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['holiday', 'special', 'closed'],
    default: 'holiday'
  }
});

// Indizes für schnelle Suche
scheduleEntrySchema.index({ date: 1, employee: 1 });
scheduleEntrySchema.index({ date: 1, position: 1 });
holidaySchema.index({ date: 1 });

const ScheduleEntry = mongoose.model('ScheduleEntry', scheduleEntrySchema);
const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = { ScheduleEntry, Holiday };

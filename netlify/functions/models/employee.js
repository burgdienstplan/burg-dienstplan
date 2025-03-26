const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['kastellan', 'hausmeister', 'museumsfuehrer'],
    required: true
  },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Employee', employeeSchema);

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

module.exports = mongoose.model('Employee', employeeSchema);

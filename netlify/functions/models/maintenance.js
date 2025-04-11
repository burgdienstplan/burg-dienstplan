const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },
  dueDate: { type: Date },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  images: [{
    url: { type: String },
    description: { type: String }
  }],
  comments: [{
    text: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    createdAt: { type: Date, default: Date.now }
  }]
});

const liftTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['maintenance', 'repair', 'inspection'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDate: { type: Date, required: true },
  completedDate: { type: Date },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  notes: { type: String },
  images: [{
    url: { type: String },
    description: { type: String }
  }],
  materials: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String }
  }]
});

const materialInventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minQuantity: { type: Number }, // Mindestbestand
  location: { type: String },
  image: { type: String },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }
});

// Logs für Materialverbrauch
const materialLogSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialInventory',
    required: true
  },
  quantity: { type: Number, required: true },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'taskType'
  },
  taskType: {
    type: String,
    enum: ['MaintenanceTask', 'LiftTask']
  },
  date: { type: Date, default: Date.now },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }
});

module.exports = {
  MaintenanceTask: mongoose.model('MaintenanceTask', maintenanceTaskSchema),
  LiftTask: mongoose.model('LiftTask', liftTaskSchema),
  MaterialInventory: mongoose.model('MaterialInventory', materialInventorySchema),
  MaterialLog: mongoose.model('MaterialLog', materialLogSchema)
};

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
    unique:   true
  },
  description: {
    type:    String,
    default: ''
  },
  isActive: {
    type:    Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Admin'
  },
  createdAt: {
    type:    Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Department', departmentSchema);
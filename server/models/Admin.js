const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true
  },
  password: {
    type:     String,
    required: true
  },
  role: {
    type:    String,
    enum:    ['superadmin', 'staff'],
    default: 'staff'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Department',
    default: null
  },
  isActive: {
    type:    Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Admin',
    default: null
  },
  createdAt: {
    type:    Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', adminSchema);
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true
  },
  username: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true
  },
  email: {
    type:      String,
    unique:    true,
    sparse:    true,
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
  // Only consulted when role is 'staff' — superadmin always has full access.
  // Controls which nav items/pages a staff member can see (see requirePermission).
  permissions: {
    type:    [String],
    default: []
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
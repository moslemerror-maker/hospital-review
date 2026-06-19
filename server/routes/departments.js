const express    = require('express');
const router     = express.Router();
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');

// Middleware to check superadmin only
const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

// GET /api/departments — all staff and superadmin can see departments
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/departments — superadmin only
router.post('/', protect, superAdminOnly, async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ message: 'Department name is required' });
  }
  try {
    const dept = await Department.create({
      name:        name.trim(),
      description: description?.trim() || '',
      createdBy:   req.admin.id
    });
    res.status(201).json(dept);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A department with this name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/departments/:id — superadmin only
router.patch('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/departments/:id — superadmin only
router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
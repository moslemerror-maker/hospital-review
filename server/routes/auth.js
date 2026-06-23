const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Admin    = require('../models/Admin');
const { protect } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// Keep only recognized permission keys, and only meaningful for staff accounts
const sanitizePermissions = (permissions, role) =>
  role === 'staff' && Array.isArray(permissions)
    ? permissions.filter((p) => PERMISSIONS.includes(p))
    : [];

const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Super Admin only.' });
  }
  next();
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username: username?.toLowerCase() }).populate('department', 'name');
    if (!admin) return res.status(401).json({ message: 'No account found with this username' });
    if (!admin.isActive) return res.status(401).json({ message: 'Your account has been deactivated. Contact Super Admin.' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role, name: admin.name, permissions: admin.permissions },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id:          admin._id,
        name:        admin.name,
        username:    admin.username,
        role:        admin.role,
        department:  admin.department,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// First-time setup only. Self-closing: once any admin account exists, this
// route refuses to create more — use POST /api/auth/users (superadmin-only)
// instead. Without this gate, anyone could call this unauthenticated route
// and hand themselves a superadmin account.
router.post('/register', async (req, res) => {
  const { name, username, email, password, role } = req.body;
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ message: 'Registration is closed. Ask a Super Admin to create your account.' });
    }
    const existing = await Admin.findOne({ username: username?.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Account already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const admin  = await Admin.create({ name, username, email, password: hashed, role: role || 'superadmin' });
    res.status(201).json({ message: 'Account created', id: admin._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/auth/users ──────────────────────────────────────────────────────
// Superadmin: get all users
router.get('/users', protect, superAdminOnly, async (req, res) => {
  try {
    const users = await Admin.find()
      .select('-password')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/auth/permissions ─────────────────────────────────────────────────
// The list of grantable permission keys, so the frontend doesn't hard-code it
router.get('/permissions', protect, superAdminOnly, (req, res) => {
  res.json(PERMISSIONS);
});

// ─── POST /api/auth/users ─────────────────────────────────────────────────────
// Superadmin: create a new staff user
router.post('/users', protect, superAdminOnly, async (req, res) => {
  const { name, username, email, password, role, department, permissions } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }
  try {
    const existing = await Admin.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Account with this username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await Admin.create({
      name,
      username,
      email:       email || undefined,
      password:    hashed,
      role:        role || 'staff',
      department:  department || null,
      permissions: sanitizePermissions(permissions, role || 'staff'),
      createdBy:   req.admin.id
    });

    res.status(201).json({ message: 'User created successfully', id: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── PATCH /api/auth/users/:id ────────────────────────────────────────────────
// Superadmin: update user details
router.patch('/users/:id', protect, superAdminOnly, async (req, res) => {
  const { name, username, email, role, department, isActive, permissions } = req.body;
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name)                      user.name        = name;
    if (username)                  user.username    = username.toLowerCase();
    if (email !== undefined)       user.email       = email || undefined;
    if (role)                      user.role        = role;
    if (department !== undefined) user.department  = department || null;
    if (isActive    !== undefined) user.isActive    = isActive;
    if (permissions !== undefined) user.permissions = sanitizePermissions(permissions, role || user.role);

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── PATCH /api/auth/users/:id/password ──────────────────────────────────────
// Superadmin: change a user's password
router.patch('/users/:id/password', protect, superAdminOnly, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const user = await Admin.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── PATCH /api/auth/me/password ─────────────────────────────────────────────
// Any logged-in user: change their own password
router.patch('/me/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new password are required' });
  }
  try {
    const admin = await Admin.findById(req.admin.id);
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
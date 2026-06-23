const express   = require('express');
const router    = express.Router();
const Complaint = require('../models/Complaint');
const Campaign  = require('../models/Campaign');
const { protect, requirePermission } = require('../middleware/auth');

// POST /api/complaints — public visitor submission
router.post('/', async (req, res) => {
  const { campaignId, visitorName, phone, rating, description, department } = req.body;
  if (!campaignId || !rating || !description || !phone) {
    return res.status(400).json({ message: 'Campaign, rating, description and contact number are required' });
  }
  try {
    const complaint = await Complaint.create({
      campaign:    campaignId,
      visitorName: visitorName  || 'Anonymous',
      phone:       phone        || '',
      rating,
      description,
      department:  department   || ''
    });

    await Campaign.findByIdAndUpdate(campaignId, { $inc: { totalComplaints: 1 } });

    res.status(201).json({
      message: 'Your feedback has been recorded. Our team will review it shortly.',
      id:      complaint._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/complaints — admin sees all; staff sees only their assigned ones
router.get('/', protect, requirePermission('complaints'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;

    // Staff users only see complaints assigned to them
    if (req.admin.role === 'staff') {
      filter.assignedTo = req.admin.id;
    }

    const complaints = await Complaint.find(filter)
      .populate('campaign',    'name location')
      .populate('assignedTo',  'name email')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/complaints/:id — single complaint detail
router.get('/:id', protect, requirePermission('complaints'), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('campaign',   'name location')
      .populate('assignedTo', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Staff can only view if assigned to them
    if (req.admin.role === 'staff' &&
        complaint.assignedTo?._id?.toString() !== req.admin.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/complaints/:id — update status, notes, assignment
router.patch('/:id', protect, requirePermission('complaints'), async (req, res) => {
  const { status, adminNotes, assignedTo } = req.body;
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Staff can only update status and notes — not reassign
    if (req.admin.role === 'staff') {
      if (complaint.assignedTo?.toString() !== req.admin.id) {
        return res.status(403).json({ message: 'You can only update your own assigned complaints' });
      }
      if (status)              complaint.status     = status;
      if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
    } else {
      // Superadmin or admin can update everything
      if (status)              complaint.status     = status;
      if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
      if (assignedTo !== undefined) complaint.assignedTo = assignedTo || null;
    }

    if (status === 'resolved') {
      if (!complaint.resolvedAt) complaint.resolvedAt = new Date();
    } else if (status) {
      // Reopened — clear the stale resolution timestamp
      complaint.resolvedAt = null;
    }

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('campaign',   'name location')
      .populate('assignedTo', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
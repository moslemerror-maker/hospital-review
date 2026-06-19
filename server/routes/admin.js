const express   = require('express');
const router    = express.Router();
const Review    = require('../models/Review');
const Complaint = require('../models/Complaint');
const Campaign  = require('../models/Campaign');
const { protect } = require('../middleware/auth');

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
// Dashboard summary numbers
router.get('/stats', protect, async (req, res) => {
  try {
    const [
      totalReviews,
      googleRedirects,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      activeCampaigns
    ] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ type: 'google_redirected' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'in-progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Campaign.countDocuments({ isActive: true })
    ]);

    res.json({
      totalReviews,
      googleRedirects,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      activeCampaigns
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
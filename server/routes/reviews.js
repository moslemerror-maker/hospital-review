const express  = require('express');
const router   = express.Router();
const Review   = require('../models/Review');
const Campaign = require('../models/Campaign');

// ─── GET /api/reviews/campaign/:id ───────────────────────────────────────────
router.get('/campaign/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)           return res.status(404).json({ message: 'Review link not found' });
    if (!campaign.isActive)  return res.status(403).json({ message: 'This review link is inactive' });
    res.json({ name: campaign.name, location: campaign.location });
  } catch (error) {
    console.error('GET /reviews/campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── POST /api/reviews/submit ─────────────────────────────────────────────────
router.post('/submit', async (req, res) => {
  const { campaignId, visitorName, rating, source } = req.body;

  if (!campaignId || !rating) {
    return res.status(400).json({ message: 'Campaign ID and rating are required' });
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ message: 'Campaign not found or inactive' });
    }

    // ── DECISION ENGINE ──────────────────────────────────────────────────────
    //  4 or 5 stars → redirect to Google
    //  3 or below   → show complaint form privately
    // ─────────────────────────────────────────────────────────────────────────

    if (numRating >= 4) {
      // Log review
      await Review.create({
        campaign:    campaignId,
        visitorName: visitorName || 'Anonymous',
        rating:      numRating,
        type:        'google_redirected',
        source:      source || 'direct'
      });

      // Use $inc to safely increment — works even if field was 0 or missing
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { totalReviews: 1, googleRedirects: 1 }
      });

      const googleUrl = `https://search.google.com/local/writereview?placeid=${process.env.GOOGLE_PLACE_ID}`;

      return res.json({
        action:    'redirect_google',
        googleUrl,
        message:   'Thank you! Redirecting to Google Reviews.'
      });

    } else {
      // 3 stars or below — log and show complaint form
      await Review.create({
        campaign:    campaignId,
        visitorName: visitorName || 'Anonymous',
        rating:      numRating,
        type:        'complaint',
        source:      source || 'direct'
      });

      // NOTE: totalComplaints is intentionally NOT incremented here. This is
      // just the star-rating step — the visitor hasn't filed a complaint yet
      // (no description, nothing for management to act on). It's incremented
      // in routes/complaints.js once they actually submit the complaint form,
      // so the count reflects real complaints instead of abandoned low ratings.
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { totalReviews: 1 }
      });

      return res.json({
        action:  'show_complaint_form',
        message: 'We are sorry to hear about your experience.'
      });
    }

  } catch (error) {
    // Log the full error so you can see it in the server terminal
    console.error('POST /reviews/submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
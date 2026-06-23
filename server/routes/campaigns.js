const express  = require('express');
const router   = express.Router();
const QRCode   = require('qrcode');
const Campaign = require('../models/Campaign');
const { protect, requirePermission } = require('../middleware/auth');

router.use(protect, requirePermission('dashboard'));

// ─── GET /api/campaigns ───────────────────────────────────────────────────────
// Get all campaigns — admin only
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── POST /api/campaigns ──────────────────────────────────────────────────────
// Create a new campaign — admin only
router.post('/', async (req, res) => {
  const { name, location, description } = req.body;

  if (!name || !location) {
    return res.status(400).json({ message: 'Name and location are required' });
  }

  try {
    const campaign = await Campaign.create({
      name,
      location,
      description: description || '',
      createdBy: req.admin.id
    });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/campaigns/:id ───────────────────────────────────────────────────
// Get single campaign details — admin only
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/campaigns/:id/qr ───────────────────────────────────────────────
// Generate a QR code image for this campaign — admin only
router.get('/:id/qr', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // This is the URL encoded inside the QR code
    // When visitors scan it, their phone opens this URL
    const reviewUrl = `${process.env.FRONTEND_URL}/review/${campaign._id}?source=qr`;

    const qrImage = await QRCode.toDataURL(reviewUrl, {
      width: 500,
      margin: 2,
      color: {
        dark:  '#1e3a5f',
        light: '#ffffff'
      }
    });

    res.json({ qr: qrImage, url: reviewUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET /api/campaigns/:id/whatsapp ─────────────────────────────────────────
// Generate a WhatsApp share link — admin only
router.get('/:id/whatsapp', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const reviewUrl = `${process.env.FRONTEND_URL}/review/${campaign._id}?source=whatsapp`;

    const message = encodeURIComponent(
      `Dear Patient,\n\nThank you for visiting ${campaign.name} – ${campaign.location}.\n\nYour feedback helps us serve you better. Please take a moment to share your experience:\n${reviewUrl}\n\nWarm regards,\nHospital Team`
    );

    // This opens WhatsApp with a pre-filled message
    // Add your hospital WhatsApp number if you want direct chat
    // Example with number: https://wa.me/919876543210?text=${message}
    const whatsappLink = `https://wa.me/?text=${message}`;

    res.json({ whatsappLink, reviewUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── PATCH /api/campaigns/:id/toggle ─────────────────────────────────────────
// Activate or deactivate a campaign — admin only
router.patch('/:id/toggle', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    campaign.isActive = !campaign.isActive;
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── DELETE /api/campaigns/:id ────────────────────────────────────────────────
// Delete a campaign — admin only
router.delete('/:id', async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
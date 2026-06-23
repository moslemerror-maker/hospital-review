const express = require('express');
const router  = express.Router();
const { protect, requirePermission } = require('../middleware/auth');
const { sendReviewRequest, sendComplaintAcknowledgement } = require('../services/gupshup');

router.use(protect, requirePermission('dashboard'));

// POST /api/whatsapp/send-review-request
// Admin triggers this after billing — sends review link to patient
router.post('/send-review-request', async (req, res) => {
  const { phone, patientName, campaignId } = req.body;

  if (!phone || !campaignId) {
    return res.status(400).json({ message: 'Phone number and campaign ID are required' });
  }

  // Clean the phone number — remove spaces, dashes, +
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');

  const result = await sendReviewRequest(cleanPhone, patientName || 'Patient', campaignId);

  if (result.success) {
    res.json({ message: `Review request sent to ${phone}`, data: result.data });
  } else {
    res.status(500).json({ message: 'Failed to send WhatsApp message', error: result.error });
  }
});

// POST /api/whatsapp/send-complaint-ack
// Auto-sent when a complaint is submitted (or manually)
router.post('/send-complaint-ack', async (req, res) => {
  const { phone, patientName } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  const result = await sendComplaintAcknowledgement(cleanPhone, patientName || 'Patient');

  if (result.success) {
    res.json({ message: 'Acknowledgement sent' });
  } else {
    res.status(500).json({ message: 'Failed to send WhatsApp message', error: result.error });
  }
});

module.exports = router;
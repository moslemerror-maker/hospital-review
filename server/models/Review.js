const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  visitorName: {
    type: String,
    default: 'Anonymous'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  type: {
    type: String,
    enum: ['google_redirected', 'complaint'],
    required: true
  },
  source: {
    type: String,
    enum: ['qr', 'whatsapp', 'direct'],
    default: 'direct'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
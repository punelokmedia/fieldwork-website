const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video', 'audio'] },
    publicId: String,
    caption: String
  }],
  keywords: [String],
  hashtags: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'published', 'rejected'],
    default: 'pending'
  },
  socialShares: {
    facebook: Boolean,
    twitter: Boolean,
    instagram: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);

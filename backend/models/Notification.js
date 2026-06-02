const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['review', 'booking', 'mentorship', 'system'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 300,
  },
  link: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

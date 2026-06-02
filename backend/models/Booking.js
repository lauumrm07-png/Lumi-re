const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mentorship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentorship',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  stripeSessionId: {
    type: String,
    default: '',
  },
  stripePaymentIntentId: {
    type: String,
    default: '',
  },
  scheduledDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

bookingSchema.index({ student: 1, createdAt: -1 });
bookingSchema.index({ mentor: 1, createdAt: -1 });
bookingSchema.index({ stripeSessionId: 1 });

bookingSchema.methods.toResponse = function () {
  return {
    id: this._id,
    student: this.student,
    mentor: this.mentor,
    mentorship: this.mentorship,
    amount: this.amount,
    currency: this.currency,
    status: this.status,
    scheduledDate: this.scheduledDate,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Booking', bookingSchema);

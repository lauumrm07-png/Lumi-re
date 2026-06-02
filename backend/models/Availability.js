const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  // Array of weekly recurring slots
  slots: [{
    day: {
      type: Number, // 0=Sunday, 1=Monday ... 6=Saturday
      required: true,
      min: 0,
      max: 6,
    },
    start: { type: String, required: true }, // "09:00"
    end:   { type: String, required: true }, // "17:00"
  }],
  // Exceptions: specific dates when the mentor is unavailable
  blockedDates: [{
    date: { type: Date, required: true },
    reason: { type: String, default: '' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);

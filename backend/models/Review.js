const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  mentorship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentorship',
    required: true,
    index: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    default: '',
  },
}, {
  timestamps: true,
});

reviewSchema.index({ mentorship: 1, student: 1 }, { unique: true });
reviewSchema.index({ mentorship: 1, createdAt: -1 });

reviewSchema.methods.toResponse = function () {
  return {
    id: this._id,
    mentorship: this.mentorship,
    student: this.student,
    rating: this.rating,
    comment: this.comment,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Review', reviewSchema);

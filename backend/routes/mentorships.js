const express = require('express');
const mongoose = require('mongoose');
const Mentorship = require('../models/Mentorship');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/mentorships
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, mentor, sort = '-createdAt' } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (mentor) filter.mentor = mentor;
    if (!mentor) filter.available = true;

    const sortOrder = sort.startsWith('-')
      ? { [sort.slice(1)]: -1 }
      : { [sort]: 1 };

    let mentorships = await Mentorship.find(filter)
      .populate('mentor', 'name avatar bio specialties stats')
      .sort(sortOrder)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Mentorship.countDocuments(filter);

    const ids = mentorships.map(m => m._id);
    const reviewStats = await Review.aggregate([
      { $match: { mentorship: { $in: ids } } },
      { $group: { _id: '$mentorship', average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const statsMap = {};
    reviewStats.forEach(s => { statsMap[s._id.toString()] = { avg: Math.round(s.average * 10) / 10, count: s.count }; });

    mentorships = mentorships.map(m => {
      const s = statsMap[m._id.toString()] || { avg: 0, count: 0 };
      m.averageRating = s.avg;
      m.reviewCount = s.count;
      return m;
    });

    res.json({
      mentorships: mentorships.map(m => m.toResponse()),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/mentorships/:id
router.get('/:id', async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('mentor', 'name avatar bio specialties stats socialLinks');

    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found' });
    }

    const reviewStats = await Review.aggregate([
      { $match: { mentorship: mentorship._id } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    mentorship.averageRating = reviewStats.length ? Math.round(reviewStats[0].average * 10) / 10 : 0;
    mentorship.reviewCount = reviewStats.length ? reviewStats[0].count : 0;

    res.json({ mentorship: mentorship.toResponse() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/mentorships
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, price, duration, skills, image } = req.body;

    const mentorship = await Mentorship.create({
      mentor: req.user._id,
      title,
      description,
      category,
      price,
      duration: duration || 60,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      image: image || 'https://images.unsplash.com/photo-1492254776308-d1fc1f3fd6f3?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb',
    });

    res.status(201).json({ mentorship: mentorship.toResponse() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/mentorships/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = {};
    const fields = ['title', 'description', 'category', 'price', 'duration', 'skills', 'available'];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim());
    }

    const updated = await Mentorship.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('mentor', 'name avatar');

    res.json({ mentorship: updated.toResponse() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/mentorships/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Mentorship.findByIdAndDelete(req.params.id);

    res.json({ message: 'Mentorship deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =========================
// REVIEWS (nested under /api/mentorships/:id/reviews)
// =========================

// GET /api/mentorships/:id/reviews — public
router.get('/:id/reviews', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ mentorship: req.params.id })
      .populate('student', 'name avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments({ mentorship: req.params.id });

    const ratings = await Review.aggregate([
      { $match: { mentorship: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    res.json({
      reviews: reviews.map(r => r.toResponse()),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      averageRating: ratings.length ? Math.round(ratings[0].average * 10) / 10 : 0,
      reviewCount: ratings.length ? ratings[0].count : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/mentorships/:id/reviews — student with completed booking
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Comment cannot exceed 500 characters' });
    }

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found' });
    }

    const booking = await Booking.findOne({
      student: req.user._id,
      mentorship: req.params.id,
      status: 'completed',
    });

    if (!booking) {
      return res.status(403).json({
        error: 'Debes tener una mentoría completada para dejar una reseña',
      });
    }

    const existing = await Review.findOne({
      mentorship: req.params.id,
      student: req.user._id,
    });

    if (existing) {
      existing.rating = rating;
      if (comment !== undefined) existing.comment = comment;
      await existing.save();
      return res.json({ review: existing.toResponse() });
    }

    const review = await Review.create({
      mentorship: req.params.id,
      student: req.user._id,
      rating,
      comment: comment || '',
    });

    const studentName = req.user.name || 'Un estudiante';
    await Notification.create({
      user: mentorship.mentor,
      type: 'review',
      message: `${studentName} te dejó una reseña de ${rating} ⭐`,
      link: `/mentorships/${req.params.id}`,
    });

    res.status(201).json({ review: review.toResponse() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/mentorships/:id/reviews — student or admin
router.delete('/:id/reviews', protect, async (req, res) => {
  try {
    const review = await Review.findOne({
      mentorship: req.params.id,
      student: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await Review.findByIdAndDelete(review._id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Mentorship = require('../models/Mentorship');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { uploadAndOptimize } = require('../middleware/upload');

const router = express.Router();

// GET /api/users — list artists
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, specialty } = req.query;

    const filter = { role: 'artist' };
    if (specialty) {
      filter.specialties = { $in: [specialty] };
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users: users.map(u => u.toPublicProfile()),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toPublicProfile() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id/profile — public profile with artworks, mentorships, reviews
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [artworks, mentorships, reviews] = await Promise.all([
      Artwork.find({ artist: id })
        .populate('artist', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(20),

      Mentorship.find({ mentor: id })
        .populate('mentor', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(20),

      Review.aggregate([
        { $lookup: { from: 'mentorships', localField: 'mentorship', foreignField: '_id', as: 'mentorshipDoc' } },
        { $unwind: '$mentorshipDoc' },
        { $match: { 'mentorshipDoc.mentor': new mongoose.Types.ObjectId(id) } },
        { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'studentDoc' } },
        { $unwind: '$studentDoc' },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            rating: 1,
            comment: 1,
            createdAt: 1,
            mentorshipTitle: '$mentorshipDoc.title',
            studentName: '$studentDoc.name',
            studentAvatar: '$studentDoc.avatar',
          },
        },
      ]),
    ]);

    res.json({
      user: user.toPublicProfile(),
      artworks: artworks.map(a => a.toResponse()),
      mentorships: mentorships.map(m => m.toResponse()),
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/me
router.patch('/me', protect, uploadAndOptimize('avatar', 'avatar'), async (req, res) => {
  try {
    const updates = {};
    const fields = ['name', 'bio', 'specialties', 'socialLinks'];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    if (typeof updates.specialties === 'string') {
      updates.specialties = updates.specialties.split(',').map(s => s.trim());
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user: user.toPublicProfile() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/me/stats — dashboard stats
router.get('/me/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [artworks, mentorships, artworkStats] = await Promise.all([
      Artwork.find({ artist: userId }).sort({ createdAt: -1 }).limit(20),
      Mentorship.find({ mentor: userId }).sort({ createdAt: -1 }).limit(20),
      Artwork.aggregate([
        { $match: { artist: userId } },
        { $group: { _id: null, totalViews: { $sum: '$views' }, totalArtworks: { $sum: 1 } } },
      ]),
    ]);

    const totalViews = artworkStats[0]?.totalViews || 0;
    const totalArtworks = artworkStats[0]?.totalArtworks || 0;

    res.json({
      stats: {
        artworks: totalArtworks,
        views: totalViews,
        mentorships: mentorships.length,
      },
      recentArtworks: artworks.map(a => a.toResponse()),
      recentMentorships: mentorships.map(m => m.toResponse()),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

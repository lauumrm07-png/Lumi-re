const express = require('express');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Mentorship = require('../models/Mentorship');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require protect + admin role
router.use(protect, authorize('admin'));

// GET /api/admin/stats — overview stats
router.get('/stats', async (req, res) => {
  try {
    const [users, artworks, mentorships, bookings, reviews] = await Promise.all([
      User.countDocuments(),
      Artwork.countDocuments(),
      Mentorship.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);

    const [recentUsers, recentArtworks, recentMentorships] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(10).select('name email role createdAt'),
      Artwork.find().populate('artist', 'name').sort({ createdAt: -1 }).limit(10),
      Mentorship.find().populate('mentor', 'name').sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      stats: { users, artworks, mentorships, bookings, reviews },
      recentUsers,
      recentArtworks: recentArtworks.map(a => a.toResponse()),
      recentMentorships: recentMentorships.map(m => m.toResponse()),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    const total = await User.countDocuments(filter);

    res.json({
      users: users.map(u => u.toPublicProfile ? u.toPublicProfile() : u),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id — update user (ban, change role, etc.)
router.patch('/users/:id', async (req, res) => {
  try {
    const { role, isBanned } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isBanned !== undefined) updates.isBanned = isBanned;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toPublicProfile ? user.toPublicProfile() : user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Clean up their content
    await Promise.all([
      Artwork.deleteMany({ artist: req.params.id }),
      Mentorship.deleteMany({ mentor: req.params.id }),
    ]);
    res.json({ message: 'User and all their content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/artworks — list all artworks
router.get('/artworks', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const artworks = await Artwork.find()
      .populate('artist', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Artwork.countDocuments();
    res.json({
      artworks: artworks.map(a => a.toResponse()),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/artworks/:id
router.delete('/artworks/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    res.json({ message: 'Artwork deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/mentorships — list all mentorships
router.get('/mentorships', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const mentorships = await Mentorship.find()
      .populate('mentor', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Mentorship.countDocuments();
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

// DELETE /api/admin/mentorships/:id
router.delete('/mentorships/:id', async (req, res) => {
  try {
    const mentorship = await Mentorship.findByIdAndDelete(req.params.id);
    if (!mentorship) return res.status(404).json({ error: 'Mentorship not found' });
    res.json({ message: 'Mentorship deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/bookings — list all bookings
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const bookings = await Booking.find()
      .populate('student', 'name email')
      .populate('mentor', 'name email')
      .populate('mentorship', 'title price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Booking.countDocuments();
    res.json({
      bookings: bookings.map(b => b.toResponse()),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

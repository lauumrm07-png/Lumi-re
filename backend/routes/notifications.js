const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — list del usuario (paginated, newest first)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments({ user: req.user._id });
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({
      notifications,
      total,
      unread,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ unread: count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read — marcar una como leída
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/read-all — marcar todas como leídas
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

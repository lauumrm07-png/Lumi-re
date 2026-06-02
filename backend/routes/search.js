const express = require('express');
const Artwork = require('../models/Artwork');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

const router = express.Router();

// GET /api/search?q=...&limit=...
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!q) {
      return res.json({ query: q, artworks: [], mentorships: [], artists: [], total: 0 });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [artworks, mentorships, artists] = await Promise.all([
      Artwork.find({
        $or: [
          { title: regex },
          { description: regex },
          { category: regex },
          { tags: regex },
        ],
      })
        .populate('artist', 'name avatar')
        .sort({ views: -1 })
        .limit(limit),

      Mentorship.find({
        $or: [
          { title: regex },
          { description: regex },
          { category: regex },
          { skills: regex },
        ],
      })
        .populate('mentor', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(limit),

      User.find({
        role: { $in: ['artist', 'admin'] },
        $or: [
          { name: regex },
          { bio: regex },
          { specialties: regex },
        ],
      })
        .select('name avatar bio specialties role stats')
        .sort({ 'stats.artworks': -1 })
        .limit(limit),
    ]);

    res.json({
      query: q,
      artworks: artworks.map(a => a.toResponse()),
      mentorships: mentorships.map(m => m.toResponse()),
      artists: artists.map(u => u.toPublicProfile()),
      total: artworks.length + mentorships.length + artists.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

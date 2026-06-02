const express = require('express');
const Artwork = require('../models/Artwork');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadAndOptimize } = require('../middleware/upload');

const router = express.Router();

// GET /api/artworks — list artworks (with filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      artist,
      tag,
      featured,
      sort = '-createdAt',
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (artist) filter.artist = artist;
    if (tag) filter.tags = { $in: [tag] };
    if (featured === 'true') filter.featured = true;

    const sortOrder = sort.startsWith('-')
      ? { [sort.slice(1)]: -1 }
      : { [sort]: 1 };

    const artworks = await Artwork.find(filter)
      .populate('artist', 'name avatar specialties')
      .sort(sortOrder)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Artwork.countDocuments(filter);

    // Increment views if logged-in user is not the artist
    if (req.user) {
      for (const artwork of artworks) {
        if (artwork.artist._id.toString() !== req.user._id.toString()) {
          await Artwork.findByIdAndUpdate(artwork._id, { $inc: { views: 1 } });
        }
      }
    }

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

// GET /api/artworks/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name avatar bio specialties stats socialLinks');

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (!req.user || req.user._id.toString() !== artwork.artist._id.toString()) {
      artwork.views += 1;
      await artwork.save();
    }

    res.json({ artwork: artwork.toResponse() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/artworks — create artwork
router.post('/', protect, uploadAndOptimize('image', 'artwork'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const { title, description, category, tags } = req.body;

    const artwork = await Artwork.create({
      artist: req.user._id,
      title,
      description,
      image: `/uploads/${req.file.filename}`,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.artworks': 1 },
    });

    res.status(201).json({ artwork: artwork.toResponse() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/artworks/:id — update artwork
router.patch('/:id', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (artwork.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = {};
    const fields = ['title', 'description', 'category', 'tags', 'featured'];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    const updated = await Artwork.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('artist', 'name avatar');

    res.json({ artwork: updated.toResponse() });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/artworks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (artwork.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Artwork.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.artworks': -1 },
    });

    res.json({ message: 'Artwork deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

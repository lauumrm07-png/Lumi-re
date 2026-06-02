const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  image: {
    type: String,
    required: [true, 'Image is required'],
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Naturaleza', 'Retrato', 'Urbano', 'Abstracto',
      'Paisaje', 'Macro', 'Blanco y Negro', 'Documental',
      'Arte Visual', 'Otro',
    ],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  featured: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

artworkSchema.index({ artist: 1, createdAt: -1 });
artworkSchema.index({ category: 1 });
artworkSchema.index({ tags: 1 });

artworkSchema.methods.toResponse = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    image: this.image,
    category: this.category,
    tags: this.tags,
    featured: this.featured,
    views: this.views,
    artist: this.artist,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Artwork', artworkSchema);

const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  mentor: {
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
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Fauna Salvaje', 'Naturaleza Salvaje', 'Safari Fotográfico',
      'Aves y Macro', 'Animales en Acción', 'Arte Natural',
      'Retrato', 'Paisaje', 'Urbano', 'Abstracto',
      'Blanco y Negro', 'Documental', 'Edición',
    ],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'MXN', 'ARS'],
  },
  duration: {
    type: Number,
    default: 60,
    min: 15,
    max: 480,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  image: {
    type: String,
    default: '',
  },
  available: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

mentorshipSchema.index({ mentor: 1, createdAt: -1 });
mentorshipSchema.index({ category: 1 });
mentorshipSchema.index({ price: 1 });

mentorshipSchema.methods.toResponse = function () {
  return {
    id: this._id,
    mentor: this.mentor,
    title: this.title,
    description: this.description,
    category: this.category,
    price: this.price,
    currency: this.currency,
    duration: this.duration,
    skills: this.skills,
    image: this.image,
    available: this.available,
    averageRating: this.averageRating || 0,
    reviewCount: this.reviewCount || 0,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Mentorship', mentorshipSchema);

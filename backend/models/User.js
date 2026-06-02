const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name cannot exceed 80 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['artist', 'student', 'admin'],
    default: 'artist',
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  specialties: [{
    type: String,
    trim: true,
  }],
  socialLinks: {
    instagram: String,
    twitter: String,
    website: String,
  },
  stats: {
    artworks: { type: Number, default: 0 },
    mentorships: { type: Number, default: 0 },
    students: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    bio: this.bio,
    avatar: this.avatar,
    specialties: this.specialties,
    socialLinks: this.socialLinks,
    stats: this.stats,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);

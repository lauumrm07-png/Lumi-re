const express = require('express');
const Booking = require('../models/Booking');
const Mentorship = require('../models/Mentorship');
const { protect } = require('../middleware/auth');

const router = express.Router();

function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;
  return require('stripe')(stripeKey);
}

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY in .env' });
    }

    const { mentorshipId } = req.body;
    if (!mentorshipId) {
      return res.status(400).json({ error: 'mentorshipId is required' });
    }

    const mentorship = await Mentorship.findById(mentorshipId).populate('mentor', 'name');
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found' });
    }
    if (!mentorship.available) {
      return res.status(400).json({ error: 'Mentorship is not available' });
    }

    const studentId = req.user._id;
    if (mentorship.mentor._id.toString() === studentId.toString()) {
      return res.status(400).json({ error: 'You cannot book your own mentorship' });
    }

    const YOUR_DOMAIN = process.env.CLIENT_URL || 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: (mentorship.currency || 'USD').toLowerCase(),
          product_data: {
            name: mentorship.title,
            description: `Mentoría de ${mentorship.duration} min con ${mentorship.mentor.name}`,
          },
          unit_amount: Math.round(mentorship.price * 100),
        },
        quantity: 1,
      }],
      metadata: {
        mentorshipId: mentorship._id.toString(),
        mentorId: mentorship.mentor._id.toString(),
        studentId: studentId.toString(),
      },
      success_url: `${YOUR_DOMAIN}/dashboard.html?payment=success`,
      cancel_url: `${YOUR_DOMAIN}/?payment=cancelled`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message || 'Payment error' });
  }
});

// GET /api/payments/my-bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({
      $or: [{ student: userId }, { mentor: userId }],
    })
      .populate('student', 'name avatar')
      .populate('mentor', 'name avatar')
      .populate('mentorship', 'title price duration')
      .sort({ createdAt: -1 });

    res.json({ bookings: bookings.map(b => b.toResponse()) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

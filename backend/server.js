const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const artworkRoutes = require('./routes/artworks');
const mentorshipRoutes = require('./routes/mentorships');
const paymentRoutes = require('./routes/payments');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  const stripe = require('stripe')(stripeKey);

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { mentorshipId, mentorId, studentId } = session.metadata;

    try {
      const Booking = require('./models/Booking');
      const Mentorship = require('./models/Mentorship');
      const User = require('./models/User');

      const mentorship = await Mentorship.findById(mentorshipId);
      if (!mentorship) {
        return res.status(404).json({ error: 'Mentorship not found' });
      }

      const booking = await Booking.create({
        student: studentId,
        mentor: mentorId,
        mentorship: mentorshipId,
        amount: session.amount_total / 100,
        currency: session.currency,
        status: 'completed',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
      });

      await User.findByIdAndUpdate(mentorId, {
        $inc: { 'stats.students': 1 },
      });

      const Notification = require('./models/Notification');
      await Notification.create({
        user: mentorId,
        type: 'booking',
        message: `¡Nueva reserva completada! Revisá tu dashboard.`,
        link: '/dashboard.html',
      });

      console.log(`Booking created: ${booking._id}`);
    } catch (error) {
      console.error('Webhook handler error:', error);
    }
  }

  res.json({ received: true });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads + frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/mentorships', mentorshipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

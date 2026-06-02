const express = require('express');
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const Mentorship = require('../models/Mentorship');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings/upcoming — upcoming sessions for the logged-in user
router.get('/upcoming', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const bookings = await Booking.find({
      $and: [
        { $or: [{ student: userId }, { mentor: userId }] },
        { status: 'completed' },
        { scheduledDate: { $gte: now } },
      ],
    })
      .populate('student', 'name avatar')
      .populate('mentor', 'name avatar')
      .populate('mentorship', 'title price duration')
      .sort({ scheduledDate: 1 });

    res.json({ bookings: bookings.map(b => b.toResponse()) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/history — past sessions
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const bookings = await Booking.find({
      $and: [
        { $or: [{ student: userId }, { mentor: userId }] },
        { $or: [
          { status: 'completed', scheduledDate: { $lt: now } },
          { status: 'completed', scheduledDate: null },
          { status: 'refunded' },
          { status: 'cancelled' },
        ]},
      ],
    })
      .populate('student', 'name avatar')
      .populate('mentor', 'name avatar')
      .populate('mentorship', 'title price duration')
      .sort({ scheduledDate: -1 });

    res.json({ bookings: bookings.map(b => b.toResponse()) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/bookings/:id/schedule — set date/time for a booking
router.patch('/:id/schedule', protect, async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    if (!scheduledDate) {
      return res.status(400).json({ error: 'scheduledDate is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the student (who booked) can schedule
    if (booking.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the student can schedule' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Cannot schedule an incomplete booking' });
    }

    const date = new Date(scheduledDate);
    if (date < new Date()) {
      return res.status(400).json({ error: 'Cannot schedule in the past' });
    }

    // Check for double booking on the mentor
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      mentor: booking.mentor,
      status: 'completed',
      scheduledDate: date,
    });

    if (conflict) {
      return res.status(409).json({ error: 'That time slot is already taken' });
    }

    booking.scheduledDate = date;
    await booking.save();

    res.json({ booking: booking.toResponse() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/mentor/:mentorId/slots?date=YYYY-MM-DD
// Returns available time slots for a given mentor on a given date
router.get('/mentor/:mentorId/slots', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date: dateStr } = req.query;

    if (!dateStr) {
      return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' });
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get mentor's availability
    const availability = await Availability.findOne({ mentor: mentorId });
    if (!availability) {
      return res.json({ slots: [], message: 'Mentor has not set availability' });
    }

    // Filter slots for this day of week
    const daySlots = availability.slots.filter(s => s.day === dayOfWeek);

    // Check if the date is blocked
    const isBlocked = availability.blockedDates.some(b =>
      b.date.toISOString().slice(0, 10) === dateStr
    );

    if (isBlocked || daySlots.length === 0) {
      return res.json({ slots: [] });
    }

    // Get existing bookings for this mentor on this date
    const dayStart = new Date(dateStr);
    const dayEnd = new Date(dateStr);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const bookings = await Booking.find({
      mentor: mentorId,
      status: 'completed',
      scheduledDate: { $gte: dayStart, $lt: dayEnd },
    });

    const bookedTimes = bookings.map(b => {
      const d = new Date(b.scheduledDate);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    // Generate available slots in 30min increments
    const slots = [];
    for (const slot of daySlots) {
      const [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      for (let m = startMin; m < endMin; m += 30) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        if (!bookedTimes.includes(time)) {
          slots.push(time);
        }
      }
    }

    res.json({ slots, date: dateStr });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/bookings/availability — set mentor's weekly availability
router.put('/availability', protect, async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'slots must be an array' });
    }

    const availability = await Availability.findOneAndUpdate(
      { mentor: req.user._id },
      { mentor: req.user._id, slots },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ availability });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/availability — get mentor's availability
router.get('/availability', protect, async (req, res) => {
  try {
    const availability = await Availability.findOne({ mentor: req.user._id });
    res.json({ availability: availability || { mentor: req.user._id, slots: [], blockedDates: [] } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

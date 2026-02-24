const express = require('express');
const router = express.Router();
const Feedback = require('../misc/Feedback');
const Registration = require('../participant/Registration');
const Event = require('../organizer/Event');
const { protect } = require('../essential/protect');

// Get all feedback across all organizer's events (aggregated)
router.get('/organizer/all', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const now = new Date();
        const events = await Event.find({
            organizer: req.user.id
        }).select('_id name');
        const eventIds = events.map(e => e._id);
        const eventMap = Object.fromEntries(events.map(e => [e._id.toString(), e.name]));

        const { rating, eventId } = req.query;
        const query = { event: { $in: eventIds } };
        if (rating) query.rating = parseInt(rating);
        if (eventId) query.event = eventId;

        const feedbacks = await Feedback.find(query)
            .select('rating comment createdAt event')
            .sort('-createdAt');

        const result = feedbacks.map(f => ({
            _id: f._id,
            rating: f.rating,
            comment: f.comment,
            createdAt: f.createdAt,
            eventName: eventMap[f.event.toString()] || 'Unknown'
        }));

        // Stats
        const total = feedbacks.length;
        let sum = 0;
        for (const f of feedbacks) sum += f.rating;
        const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

        res.json({ feedbacks: result, average, events });
    } catch (err) {
        console.error('Organizer feedback error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit anonymous feedback
router.post('/', protect, async (req, res) => {
    try {
        const { eventId, rating, comment } = req.body;

        if (!eventId || !rating) {
            return res.status(400).json({ message: 'Event ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Verify user attended the event
        const registration = await Registration.findOne({
            user: req.user.id,
            event: eventId,
            status: 'Confirmed'
        });

        if (!registration) {
            return res.status(400).json({ message: 'You must be registered for this event to give feedback' });
        }

        // Check for existing feedback
        const existing = await Feedback.findOne({ event: eventId, user: req.user.id });
        if (existing) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event' });
        }

        const feedback = await Feedback.create({
            event: eventId,
            user: req.user.id,
            rating,
            comment: comment || ''
        });

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        console.error('Submit feedback error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check if user already submitted feedback
router.get('/check/:eventId', protect, async (req, res) => {
    try {
        const existing = await Feedback.findOne({
            event: req.params.eventId,
            user: req.user.id
        });

        res.json({ hasSubmitted: !!existing });
    } catch (err) {
        console.error('Check feedback error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get feedback for an event (organizer view - anonymous)
router.get('/event/:eventId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { rating } = req.query; // optional filter by rating
        const query = { event: req.params.eventId };
        if (rating) {
            query.rating = parseInt(rating);
        }

        // Anonymous: don't populate user, don't return user field
        const feedbacks = await Feedback.find(query)
            .select('rating comment createdAt')
            .sort('-createdAt');

        res.json(feedbacks);
    } catch (err) {
        console.error('Get feedback error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

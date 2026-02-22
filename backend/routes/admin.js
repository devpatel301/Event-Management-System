const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const { protect } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

router.get('/stats', protect, admin, async (req, res) => {
    try {
        const userCount = await User.countDocuments({ role: 'participant' });
        const organizerCount = await Organizer.countDocuments();
        const eventCount = await Event.countDocuments();

        res.json({
            users: userCount,
            organizers: organizerCount,
            events: eventCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/organizers', protect, admin, async (req, res) => {
    try {
        const organizers = await Organizer.find().select('-password');
        res.json(organizers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/organizers', protect, admin, async (req, res) => {
    try {
        const { name, email, password, category, description } = req.body;

        let organizer = await Organizer.findOne({ email });
        if (organizer) {
            return res.status(400).json({ message: 'Organizer already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique 7-digit organizer ID
        const organizerId = Math.floor(1000000 + Math.random() * 9000000).toString();

        organizer = await Organizer.create({
            name,
            email,
            password: hashedPassword,
            category,
            desc: description,
            organizerId,
            role: 'organizer'
        });

        res.status(201).json({ message: 'Organizer created successfully', organizer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/organizers/:id', protect, admin, async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.params.id });
        const eventIds = events.map(e => e._id);
        const Registration = require('../models/Registration');
        await Registration.deleteMany({ event: { $in: eventIds } });
        await Event.deleteMany({ organizer: req.params.id });
        await Organizer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Organizer and all associated data removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/organizers/:id/reset-password', protect, admin, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const organizer = await Organizer.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true }
        );

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        res.json({ message: 'Password reset successfully', organizer: { name: organizer.name, email: organizer.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// toggle archive
router.put('/organizers/:id/archive', protect, admin, async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.params.id);
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        organizer.archived = !organizer.archived;
        await organizer.save();
        res.json({ message: `Organizer ${organizer.archived ? 'archived' : 'unarchived'} successfully`, archived: organizer.archived });
    } catch (error) {
        console.error('Archive Error:', error);
        res.status(500).json({ message: 'Server error during archive' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { sendRegistrationConfirmation } = require('../services/emailService');

function generateTicketId() {
    return 'TKT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

router.post('/', protect, async (req, res) => {
    try {
        const { eventId, formData, merchandiseDetails } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.status !== 'Published' && event.status !== 'Ongoing') {
            return res.status(400).json({ message: 'Event is not open for registration' });
        }

        var currentDate = new Date();
        var deadlineDate = new Date(event.registrationDeadline);
        if (currentDate > deadlineDate) {
            return res.status(400).json({ message: 'Registration deadline passed' });
        }

        const existingReg = await Registration.findOne({ user: req.user.id, event: eventId });
        if (existingReg) {
            return res.status(400).json({ message: 'Already registered' });
        }

        if (event.registrationLimit > 0) {
            if (event.registeredCount >= event.registrationLimit) {
                return res.status(400).json({ message: 'Event is full' });
            }
        }
        event.registeredCount = (event.registeredCount || 0) + 1;

        if (event.type === 'Merchandise' && merchandiseDetails) {
            // Validate and decrement stock
            const itemIndex = event.merchandiseItems.findIndex(item => item._id.toString() === merchandiseDetails.itemId);
            if (itemIndex === -1) {
                return res.status(400).json({ message: 'Invalid merchandise item' });
            }

            const qty = merchandiseDetails.quantity || 1;
            if (event.merchandiseItems[itemIndex].stock < qty) {
                return res.status(400).json({ message: 'Item out of stock' });
            }

            // Manual decrement
            event.merchandiseItems[itemIndex].stock -= qty;
        }

        // Save changes to event
        await event.save();

        const ticketId = generateTicketId();
        const registration = await Registration.create({
            user: req.user.id,
            event: eventId,
            ticketId,
            formData,
            merchandiseDetails: event.type === 'Merchandise' ? merchandiseDetails : undefined,
            status: 'Confirmed'
        });

        await registration.populate('user', 'firstName lastName email');
        await registration.populate({
            path: 'event',
            select: 'name startDate endDate organizer',
            populate: { path: 'organizer', select: 'name' }
        });

        const organizerName = registration.event.organizer ? registration.event.organizer.name : 'Felicity Team';

        sendRegistrationConfirmation(
            registration.user,
            registration.event,
            ticketId,
            organizerName
        ).catch(err => console.error('Email failed:', err));

        res.status(201).json(registration);
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/my', protect, async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user.id })
            .populate({
                path: 'event',
                select: 'name type startDate endDate organizer',
                populate: { path: 'organizer', select: 'name' }
            })
            .populate('team', 'name')
            .sort('-createdAt');
        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/ticket', protect, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id)
            .populate('event')
            .populate('user', 'firstName lastName email')
            .populate('team', 'name');

        if (!registration) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // owner or admin only
        if (registration.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(registration);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

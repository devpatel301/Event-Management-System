const express = require('express');
const router = express.Router();
const Organizer = require('../admin/Organizer');
const Event = require('../organizer/Event');
const { protect } = require('../essential/protect');

router.get('/', async (req, res) => {
    try {
        const organizers = await Organizer.find({ archived: { $ne: true } }).select('-password');
        res.json(organizers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const organizer = await Organizer.findById(req.params.id).select('-password');
        if (!organizer || organizer.archived) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const today = new Date();
        const upcomingEvents = await Event.find({
            organizer: req.params.id,
            endDate: { $gte: today },
            status: { $in: ['Published', 'Ongoing'] }
        }).sort('startDate');

        const pastEvents = await Event.find({
            organizer: req.params.id,
            endDate: { $lt: today },
            status: { $in: ['Completed', 'Closed'] }
        }).sort('-startDate');

        res.json({
            organizer,
            upcomingEvents,
            pastEvents
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

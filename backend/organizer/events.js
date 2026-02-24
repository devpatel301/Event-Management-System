const express = require('express');
const router = express.Router();
const Event = require('../organizer/Event');
const Organizer = require('../admin/Organizer');
const { protect } = require('../essential/protect');
const { sendEventCreatedNotification } = require('../services/discordService');

router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can create events' });
        }

        const {
            name, description, type, eligibility,
            startDate, endDate, registrationDeadline,
            registrationLimit, fee, tags, customForm, merchandiseItems, status
        } = req.body;

        const event = await Event.create({
            name, description, type, eligibility,
            startDate, endDate, registrationDeadline,
            registrationLimit, fee, tags,
            customForm: customForm || [],
            merchandiseItems: type === 'Merchandise' ? merchandiseItems : [],
            status: status || 'Draft',
            organizer: req.user.id
        });

        await event.populate('organizer', 'name organizerId');
        const orgName = event.organizer?.name || 'Unknown Organizer';
        const orgId = event.organizer?.organizerId || '';
        sendEventCreatedNotification(event, orgName, orgId)
            .catch(err => console.error('Discord notification failed:', err));

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const { search, type } = req.query;
        const archivedOrgs = await Organizer.find({ archived: true }).select('_id');
        const archivedOrgIds = archivedOrgs.map(o => o._id);
        let query = { status: { $in: ['Published', 'Ongoing'] }, organizer: { $nin: archivedOrgIds } };


        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (type) {
            query.type = type;
        }

        const events = await Event.find(query).populate('organizer', 'name category');

        // Auto-update status based on time
        const now = new Date();
        const updates = events.map(async (event) => {
            let changed = false;
            // skip draft/cancelled
            if (event.status !== 'Draft' && event.status !== 'Cancelled') {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);

                if (now > end && event.status !== 'Completed') {
                    event.status = 'Completed';
                    changed = true;
                } else if (now >= start && now <= end && event.status !== 'Ongoing') {
                    event.status = 'Ongoing';
                    changed = true;
                } else if (now < start && event.status === 'Ongoing') {
                    event.status = 'Published';
                    changed = true;
                }
            }
            if (changed) {
                try {
                    await Event.updateOne({ _id: event._id }, { status: event.status }, { runValidators: false });
                } catch (err) {
                    console.error(`Failed to auto-update event ${event._id}:`, err.message);
                }
            }
            return event;
        });

        await Promise.all(updates);

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// top 5 trending by registrations in past 24h
router.get('/trending', async (req, res) => {
    try {
        const Registration = require('../participant/Registration');
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const counts = await Registration.aggregate([
            { $match: { createdAt: { $gte: since }, status: 'Confirmed' } },
            { $group: { _id: '$event', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        if (counts.length === 0) {
            // fallback: top 5 by real all-time registration count
            const archivedOrgs2 = await Organizer.find({ archived: true }).select('_id');
            const archivedOrgIds2 = archivedOrgs2.map(o => o._id);
            const allEvents = await Event.find({ status: { $in: ['Published', 'Ongoing'] }, organizer: { $nin: archivedOrgIds2 } })
                .populate('organizer', 'name category')
                .lean();
            if (allEvents.length > 0) {
                const allIds = allEvents.map(e => e._id);
                const allCounts = await Registration.aggregate([
                    { $match: { event: { $in: allIds }, status: 'Confirmed' } },
                    { $group: { _id: '$event', count: { $sum: 1 } } }
                ]);
                const allCountMap = Object.fromEntries(allCounts.map(c => [c._id.toString(), c.count]));
                allEvents.forEach(e => { e.registeredCount = allCountMap[e._id.toString()] || 0; });
                allEvents.sort((a, b) => b.registeredCount - a.registeredCount);
            }
            return res.json(allEvents.slice(0, 5));
        }

        const archivedOrgs3 = await Organizer.find({ archived: true }).select('_id');
        const archivedOrgIds3 = archivedOrgs3.map(o => o._id);
        const eventIds = counts.map(c => c._id);
        const eventDocs = await Event.find({ _id: { $in: eventIds }, organizer: { $nin: archivedOrgIds3 } }).populate('organizer', 'name category').lean();
        const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
        eventDocs.forEach(e => { e.registeredCount = countMap[e._id.toString()] || 0; });
        eventDocs.sort((a, b) => (countMap[b._id.toString()] || 0) - (countMap[a._id.toString()] || 0));
        res.json(eventDocs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/organizer/analytics', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') return res.status(403).json({ message: 'Not authorized' });
        const Registration = require('../participant/Registration');

        const completedEvents = await Event.find({
            organizer: req.user.id,
            status: 'Completed'
        });
        const completedIds = completedEvents.map(e => e._id);

        let totalRegistrations = 0;
        let totalAttended = 0;
        let totalRevenue = 0;

        if (completedIds.length > 0) {
            const stats = await Registration.aggregate([
                { $match: { event: { $in: completedIds }, status: 'Confirmed' } },
                { $group: { _id: null, totalRegistrations: { $sum: 1 }, totalAttended: { $sum: { $cond: ['$attended', 1, 0] } } } }
            ]);
            totalRegistrations = stats[0]?.totalRegistrations || 0;
            totalAttended = stats[0]?.totalAttended || 0;
            totalRevenue = completedEvents.reduce((sum, e) => sum + (e.registeredCount || 0) * (e.fee || 0), 0);
        }

        res.json({
            completedEventCount: completedEvents.length,
            totalRegistrations,
            totalAttended,
            totalRevenue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/organizer/my', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const Registration = require('../participant/Registration');
        const events = await Event.find({ organizer: req.user.id }).sort('-createdAt').lean();
        if (events.length > 0) {
            const eventIds = events.map(e => e._id);
            const regCounts = await Registration.aggregate([
                { $match: { event: { $in: eventIds }, status: { $in: ['Confirmed', 'Pending'] } } },
                { $group: { _id: '$event', count: { $sum: 1 } } }
            ]);
            const countMap = Object.fromEntries(regCounts.map(r => [r._id.toString(), r.count]));
            events.forEach(e => { e.registeredCount = countMap[e._id.toString()] || 0; });
        }
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        let allowedUpdates = {};

        if (event.status === 'Draft') {
            // draft: all fields
            allowedUpdates = req.body;
        } else if (event.status === 'Published') {
            // published: limited fields only
            const { description, registrationDeadline, registrationLimit, status, tags } = req.body;
            if (description !== undefined) allowedUpdates.description = description;
            if (registrationDeadline !== undefined) allowedUpdates.registrationDeadline = registrationDeadline;
            if (registrationLimit !== undefined) allowedUpdates.registrationLimit = registrationLimit;
            if (tags !== undefined) allowedUpdates.tags = tags;
            if (status !== undefined) {
                const allowed = ['Published', 'Ongoing', 'Cancelled'];
                if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status transition from Published' });
                allowedUpdates.status = status;
            }
        } else if (event.status === 'Ongoing') {
            // ongoing: status only
            if (req.body.status !== undefined) {
                const allowed = ['Completed', 'Cancelled', 'Ongoing'];
                if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status transition from Ongoing' });
                allowedUpdates.status = req.body.status;
            } else {
                return res.status(400).json({ message: 'Ongoing events only allow status changes (Completed or Closed)' });
            }
        } else {
            // completed/closed: status only
            if (req.body.status !== undefined) {
                allowedUpdates.status = req.body.status;
            } else {
                return res.status(400).json({ message: 'This event cannot be edited further' });
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, allowedUpdates, { new: true, runValidators: false });
        res.json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/registrations', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const Registration = require('../participant/Registration');
        const registrations = await Registration.find({ event: req.params.id })
            .populate('user', 'firstName lastName email contactNumber collegeName')
            .populate('team', 'name');

        res.json(registrations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (event.status !== 'Draft') {
            return res.status(400).json({ message: 'Only draft events can be deleted' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;

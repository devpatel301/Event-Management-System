const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// Scan QR / Mark attendance by ticket ID
router.post('/scan', protect, async (req, res) => {
    try {
        // Only organizers can scan
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can mark attendance' });
        }

        const { ticketId, eventId } = req.body;
        if (!ticketId || !eventId) {
            return res.status(400).json({ message: 'Ticket ID and Event ID are required' });
        }

        const registration = await Registration.findOne({ ticketId, event: eventId })
            .populate('user', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ message: 'Invalid ticket. No registration found.' });
        }

        if (registration.status !== 'Confirmed') {
            return res.status(400).json({ message: 'Registration is not confirmed' });
        }

        // Check duplicate scan
        if (registration.attended) {
            return res.status(400).json({
                message: 'Already scanned',
                attendedAt: registration.attendedAt,
                user: registration.user
            });
        }

        registration.attended = true;
        registration.attendedAt = new Date();
        await registration.save();

        res.json({
            message: 'Attendance marked successfully',
            user: registration.user,
            ticketId: registration.ticketId,
            attendedAt: registration.attendedAt
        });
    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Manual override (with audit note)
router.post('/manual', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can mark attendance' });
        }

        const { registrationId, note } = req.body;

        const registration = await Registration.findById(registrationId)
            .populate('user', 'firstName lastName email');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.attended = true;
        registration.attendedAt = new Date();
        registration.attendanceNote = note || 'Manual override by organizer';
        await registration.save();

        res.json({
            message: 'Attendance marked manually',
            user: registration.user,
            ticketId: registration.ticketId,
            attendedAt: registration.attendedAt,
            note: registration.attendanceNote
        });
    } catch (err) {
        console.error('Manual attendance error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get attendance stats for an event
router.get('/event/:eventId', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const registrations = await Registration.find({
            event: req.params.eventId,
            status: 'Confirmed'
        }).populate('user', 'firstName lastName email contactNumber collegeName');

        const attended = [];
        const notAttended = [];
        for (const r of registrations) {
            if (r.attended) {
                attended.push(r);
            } else {
                notAttended.push(r);
            }
        }

        res.json({
            total: registrations.length,
            attendedCount: attended.length,
            notAttendedCount: notAttended.length,
            attended,
            notAttended
        });
    } catch (err) {
        console.error('Attendance stats error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export attendance as CSV
router.get('/event/:eventId/export', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const registrations = await Registration.find({
            event: req.params.eventId,
            status: 'Confirmed'
        }).populate('user', 'firstName lastName email contactNumber collegeName');

        const headers = 'Ticket ID,Name,Email,Contact,College,Attended,Attended At,Note\n';
        const rows = [];
        for (const r of registrations) {
            const row = [
                r.ticketId,
                `${r.user.firstName} ${r.user.lastName}`,
                r.user.email,
                r.user.contactNumber || 'N/A',
                r.user.collegeName || 'N/A',
                r.attended ? 'Yes' : 'No',
                r.attendedAt ? new Date(r.attendedAt).toLocaleString() : 'N/A',
                r.attendanceNote || ''
            ].join(',');
            rows.push(row);
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
        res.send(headers + rows.join('\n'));
    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

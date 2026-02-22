const express = require('express');
const router = express.Router();
const PasswordResetRequest = require('../models/PasswordResetRequest');
const Organizer = require('../models/Organizer');
const { protect } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Organizer: Create a password reset request
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can request password reset' });
        }

        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'Please provide a reason' });
        }

        // Check for existing pending request
        const pending = await PasswordResetRequest.findOne({
            organizer: req.user.id,
            status: 'Pending'
        });
        if (pending) {
            return res.status(400).json({ message: 'You already have a pending request' });
        }

        const request = await PasswordResetRequest.create({
            organizer: req.user.id,
            reason
        });

        await request.populate('organizer', 'name email');
        res.status(201).json(request);
    } catch (err) {
        console.error('Password reset request error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Organizer: Get my password reset requests
router.get('/my', protect, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const requests = await PasswordResetRequest.find({ organizer: req.user.id })
            .sort('-createdAt');

        res.json(requests);
    } catch (err) {
        console.error('Get my requests error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Get all password reset requests
router.get('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }

        const requests = await PasswordResetRequest.find()
            .populate('organizer', 'name email category')
            .sort('-createdAt');

        res.json(requests);
    } catch (err) {
        console.error('Get all requests error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Approve a request
router.put('/:id/approve', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }

        const request = await PasswordResetRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Request already resolved' });
        }

        // Auto-generate a new password
        const newPassword = crypto.randomBytes(4).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        // Update organizer password
        await Organizer.findByIdAndUpdate(request.organizer, { password: hashed });

        // Update request
        request.status = 'Approved';
        request.adminComment = req.body.comment || '';
        request.generatedPassword = newPassword;
        request.resolvedDate = new Date();
        await request.save();

        await request.populate('organizer', 'name email');

        res.json({
            message: 'Password reset approved',
            request,
            generatedPassword: newPassword
        });
    } catch (err) {
        console.error('Approve error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Reject a request
router.put('/:id/reject', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only' });
        }

        const request = await PasswordResetRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Request already resolved' });
        }

        request.status = 'Rejected';
        request.adminComment = req.body.comment || '';
        request.resolvedDate = new Date();
        await request.save();

        await request.populate('organizer', 'name email');
        res.json({ message: 'Request rejected', request });
    } catch (err) {
        console.error('Reject error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

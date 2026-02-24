const express = require('express');
const router = express.Router();
const User = require('../essential/User');
const { protect } = require('../essential/protect');

router.put('/profile', protect, async (req, res) => {
    try {
        let user;
        const Collection = req.user.role === 'organizer' ? require('../admin/Organizer') : User;

        user = await Collection.findById(req.user.id);

        if (user) {
            if (req.user.role === 'organizer') {
                user.name = req.body.name || user.name;
                user.desc = req.body.desc || user.desc;
                user.category = req.body.category || user.category;
                if (req.body.contactNumber !== undefined) user.contactNumber = req.body.contactNumber;
                // email is usually not editable or handled carefully
            } else {
                user.firstName = req.body.firstName || user.firstName;
                user.lastName = req.body.lastName || user.lastName;
                user.contactNumber = req.body.contactNumber || user.contactNumber;
                user.collegeName = req.body.collegeName || user.collegeName;
                user.interests = req.body.interests !== undefined ? req.body.interests : user.interests;
                user.followedClubs = req.body.followedClubs || user.followedClubs;
                if (req.body.hasCompletedOnboarding !== undefined) {
                    user.hasCompletedOnboarding = req.body.hasCompletedOnboarding;
                }
            }

            const updatedUser = await user.save();

            const responsePayload = {
                _id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                token: req.headers.authorization.split(' ')[1]
            };

            if (req.user.role === 'organizer') {
                responsePayload.name = updatedUser.name;
                responsePayload.category = updatedUser.category;
            } else {
                responsePayload.firstName = updatedUser.firstName;
                responsePayload.lastName = updatedUser.lastName;
                responsePayload.interests = updatedUser.interests;
            }

            res.json(responsePayload);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/profile', protect, async (req, res) => {
    try {
        const Collection = req.user.role === 'organizer' ? require('../admin/Organizer') : User;
        const user = await Collection.findById(req.user.id).select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/profile/password', protect, async (req, res) => {
    try {
        if (req.user.role === 'organizer') {
            return res.status(403).json({ message: 'Organizers must request a password reset from an admin.' });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        const bcrypt = require('bcrypt');

        if (user && (await bcrypt.compare(currentPassword, user.password))) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../essential/User');
const Organizer = require('../admin/Organizer');

function generateToken(id, role) {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, participantType: clientType, contactNumber, collegeName: clientCollege } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Only participants can register via UI
        const effectiveRole = 'participant';

        // IIIT domain check overrides client selection
        const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
        const isIIITEmail = iiitDomains.some(domain => email.endsWith(domain));
        const participantType = isIIITEmail ? 'IIIT' : (clientType || 'Non-IIIT');
        const collegeName = isIIITEmail ? 'IIIT Hyderabad' : (clientCollege || '');

        if (!contactNumber) {
            return res.status(400).json({ message: 'Contact number is required' });
        }
        if (!isIIITEmail && !clientCollege) {
            return res.status(400).json({ message: 'College/Organization name is required' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: effectiveRole,
            participantType,
            contactNumber,
            collegeName
        };

        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user.id,
                firstName: user.firstName,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = null;
        let role = 'participant';

        // check users
        const userDoc = await User.findOne({ email });
        if (userDoc) {
            user = userDoc;
            role = userDoc.role;
        }

        // check organizers
        if (!user) {
            const orgDoc = await Organizer.findOne({ email });
            if (orgDoc) {
                user = orgDoc;
                role = 'organizer';
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({
                _id: user.id,
                name: user.firstName || user.name, // User has firstName, Organizer has name
                email: user.email,
                role: role,
                token: generateToken(user.id, role)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

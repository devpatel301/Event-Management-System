require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { setupEmailService } = require('./services/emailService');
const path = require('path');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

connectDB();
setupEmailService();

// Essential
// Essential
app.use('/api/auth', require('./essential/auth'));

// Admin
app.use('/api/admin', require('./admin/admin'));
app.use('/api/organizers', require('./admin/organizers'));
app.use('/api/password-resets', require('./admin/passwordResets'));

// Organizer
app.use('/api/events', require('./organizer/events'));
app.use('/api/attendance', require('./organizer/attendance'));

// Participant
app.use('/api/users', require('./participant/users'));
app.use('/api/registrations', require('./participant/registrations'));

// Misc
app.use('/api/teams', require('./misc/teams'));
app.use('/api/chat', require('./misc/chat'));
app.use('/api/feedback', require('./misc/feedback'));
app.use('/api/upload', require('./misc/upload'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({
        message: 'Felicity Event Management API',
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/organizers', require('./routes/organizers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/password-resets', require('./routes/passwordResets'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/upload', require('./routes/upload'));
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
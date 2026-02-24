const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Club Name
    organizerId: { type: String, unique: true }, // Auto-generated 7-digit ID
    desc: { type: String, required: true }, // Description
    category: {
        type: String,
        enum: ['Cultural', 'Technical', 'Sports', 'Clubs', 'Councils', 'Fest Teams', 'Other'],
        required: true
    },
    email: { type: String, required: true, unique: true }, // Contact/Login Email
    password: { type: String, required: true },
    role: { type: String, default: 'organizer' }, // Always organizer

    contactNumber: { type: String },

    archived: { type: Boolean, default: false }
});

module.exports = mongoose.model('Organizer', organizerSchema);

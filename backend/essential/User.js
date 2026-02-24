const mongoose = require('mongoose');

// Schema for Participants and Admins
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    role: {
        type: String,
        enum: ['participant', 'admin'],
        default: 'participant'
    },
    participantType: {
        type: String,
        enum: ['IIIT', 'Non-IIIT'],
        default: 'Non-IIIT'
    },

    // Specific to Participants
    collegeName: { type: String },
    contactNumber: { type: String },

    // User Preferences
    interests: [{ type: String }],
    followedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' }],
    hasCompletedOnboarding: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);

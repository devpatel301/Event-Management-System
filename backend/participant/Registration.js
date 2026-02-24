const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Cancelled', 'Pending'],
        default: 'Confirmed'
    },
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    // For custom form fields
    formData: {
        type: Map,
        of: String
    },
    // For merchandise
    merchandiseDetails: {
        itemId: String,
        size: String,
        color: String,
        variant: String,
        quantity: { type: Number, default: 1 }
    },
    // For hackathon teams
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    // Attendance tracking
    attended: { type: Boolean, default: false },
    attendedAt: { type: Date },
    attendanceNote: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);

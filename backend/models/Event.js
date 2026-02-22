const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['Normal', 'Merchandise', 'Hackathon'],
        default: 'Normal'
    },
    // Hackathon team size limits
    minTeamSize: { type: Number, default: 2 },
    maxTeamSize: { type: Number, default: 4 },
    eligibility: { type: String, required: true }, // e.g., "All", "IIIT Students"

    // Dates
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },

    // Capacity & Fee
    registrationLimit: { type: Number, required: true },
    registeredCount: { type: Number, default: 0 },
    fee: { type: Number, required: true, default: 0 },

    // Relations
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },

    tags: { type: [String], default: [] }, // Relaxed validation to prevent crashes on existing data

    // Status
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Ongoing', 'Closed', 'Completed'],
        default: 'Draft'
    },

    // Merchandise specific fields
    merchandiseItems: [{
        name: String,
        price: Number,
        stock: Number,
        image: String,
        description: String
    }],

    // Custom Registration Form (Phase 8/10)
    customForm: [{
        label: { type: String, required: true },
        type: {
            type: String,
            enum: ['text', 'number', 'dropdown', 'checkbox', 'radio', 'file'],
            default: 'text'
        },
        options: [String], // For dropdown/checkbox
        required: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);

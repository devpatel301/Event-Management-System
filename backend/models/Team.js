const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teamCode: { type: String, required: true, unique: true },
    maxSize: { type: Number, required: true },
    status: {
        type: String,
        enum: ['forming', 'complete', 'registered'],
        default: 'forming'
    }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);

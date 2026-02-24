const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['text', 'file', 'link'], default: 'text' },
    fileUrl: { type: String },
    fileName: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

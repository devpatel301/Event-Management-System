const express = require('express');
const router = express.Router();
const ChatMessage = require('../misc/ChatMessage');
const Team = require('../misc/Team');
const { protect } = require('../essential/protect');

// In-memory store for typing and online status (simple approach)
const typingUsers = {}; // { teamId: { odify: timestamp } }
const onlineUsers = {}; // { teamId: { userId: timestamp } }

// Verify user is a member of the team
async function verifyTeamMember(teamId, userId) {
    const team = await Team.findById(teamId);
    if (!team) return null;
    if (!team.members.some(m => m.toString() === userId)) return null;
    return team;
}

// Send a message
router.post('/:teamId/messages', protect, async (req, res) => {
    try {
        const team = await verifyTeamMember(req.params.teamId, req.user.id);
        if (!team) return res.status(403).json({ message: 'Not a team member' });

        const { message, type, fileUrl, fileName } = req.body;
        if ((!message || !message.trim()) && !fileUrl) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        const chatMessage = await ChatMessage.create({
            team: req.params.teamId,
            sender: req.user.id,
            message: (message || '').trim() || (fileName || fileUrl || 'Shared a file'),
            type: type || 'text',
            fileUrl: fileUrl || undefined,
            fileName: fileName || undefined
        });

        await chatMessage.populate('sender', 'firstName lastName');

        // Update online status
        if (!onlineUsers[req.params.teamId]) onlineUsers[req.params.teamId] = {};
        onlineUsers[req.params.teamId][req.user.id] = Date.now();

        res.status(201).json(chatMessage);
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages (with optional since parameter for polling)
router.get('/:teamId/messages', protect, async (req, res) => {
    try {
        const team = await verifyTeamMember(req.params.teamId, req.user.id);
        if (!team) return res.status(403).json({ message: 'Not a team member' });

        const { since } = req.query;
        let query = { team: req.params.teamId };

        // If 'since' provided, only get newer messages (for polling)
        if (since) {
            query.timestamp = { $gt: new Date(since) };
        }

        const messages = await ChatMessage.find(query)
            .populate('sender', 'firstName lastName')
            .sort('timestamp')
            .limit(200);

        // Mark as read
        const team2 = await Team.findById(req.params.teamId);
        if (team2) {
            team2.lastReadAt.set(req.user.id, new Date());
            await team2.save();
        }

        // Update online status
        if (!onlineUsers[req.params.teamId]) onlineUsers[req.params.teamId] = {};
        onlineUsers[req.params.teamId][req.user.id] = Date.now();

        res.json(messages);
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Signal typing
router.post('/:teamId/typing', protect, async (req, res) => {
    try {
        if (!typingUsers[req.params.teamId]) typingUsers[req.params.teamId] = {};
        typingUsers[req.params.teamId][req.user.id] = Date.now();

        if (!onlineUsers[req.params.teamId]) onlineUsers[req.params.teamId] = {};
        onlineUsers[req.params.teamId][req.user.id] = Date.now();

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get online and typing status
router.get('/:teamId/status', protect, async (req, res) => {
    try {
        const now = Date.now();
        const teamTyping = typingUsers[req.params.teamId] || {};
        const teamOnline = onlineUsers[req.params.teamId] || {};

        // Online = active in last 30 seconds
        const online = [];
        for (const uid in teamOnline) {
            const time = teamOnline[uid];
            if (now - time < 30000) {
                online.push(uid);
            }
        }

        // Typing = signaled in last 3 seconds, exclude current user
        const typing = [];
        for (const uid in teamTyping) {
            const time = teamTyping[uid];
            if (now - time < 3000 && uid !== req.user.id) {
                typing.push(uid);
            }
        }

        // Update caller's online status
        if (!onlineUsers[req.params.teamId]) onlineUsers[req.params.teamId] = {};
        onlineUsers[req.params.teamId][req.user.id] = now;

        res.json({ online, typing });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread message counts for all user's teams
router.get('/unread/counts', protect, async (req, res) => {
    try {
        const teams = await Team.find({ members: req.user.id });
        const result = {};
        for (const team of teams) {
            const lastRead = team.lastReadAt?.get(req.user.id) || new Date(0);
            const unreadCount = await ChatMessage.countDocuments({
                team: team._id,
                timestamp: { $gt: lastRead },
                sender: { $ne: req.user.id }
            });
            if (unreadCount > 0) {
                result[team._id.toString()] = unreadCount;
            }
        }
        res.json(result);
    } catch (err) {
        console.error('Unread counts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Generate unique team code
function generateTeamCode() {
    return 'TEAM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateTicketId() {
    return 'TKT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Create a team
router.post('/', protect, async (req, res) => {
    try {
        const { eventId, teamName, maxSize } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.type !== 'Hackathon') return res.status(400).json({ message: 'Not a hackathon event' });

        // Validate team size against event limits
        if (maxSize < event.minTeamSize || maxSize > event.maxTeamSize) {
            return res.status(400).json({
                message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`
            });
        }

        // Check if user already has a team for this event
        const existing = await Team.findOne({
            event: eventId,
            members: req.user.id
        });
        if (existing) return res.status(400).json({ message: 'You already have a team for this event' });

        const teamCode = generateTeamCode();
        const team = await Team.create({
            name: teamName,
            event: eventId,
            leader: req.user.id,
            members: [req.user.id],
            teamCode,
            maxSize,
            status: 'forming'
        });

        await team.populate('members', 'firstName lastName email');
        await team.populate('event', 'name startDate endDate');

        res.status(201).json(team);
    } catch (err) {
        console.error('Create team error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join a team
router.post('/join', protect, async (req, res) => {
    try {
        const { teamCode } = req.body;

        const team = await Team.findOne({ teamCode });
        if (!team) return res.status(404).json({ message: 'Invalid team code' });
        if (team.status !== 'forming') return res.status(400).json({ message: 'Team is already complete' });

        // Check if already in a team for this event
        const existing = await Team.findOne({
            event: team.event,
            members: req.user.id
        });
        if (existing) return res.status(400).json({ message: 'You already have a team for this event' });

        if (team.members.length >= team.maxSize) {
            return res.status(400).json({ message: 'Team is full' });
        }

        team.members.push(req.user.id);

        // Auto-complete when full
        if (team.members.length >= team.maxSize) {
            team.status = 'complete';

            // Generate tickets for all members
            const event = await Event.findById(team.event);
            for (const memberId of team.members) {
                const alreadyReg = await Registration.findOne({ user: memberId, event: team.event });
                if (!alreadyReg) {
                    await Registration.create({
                        user: memberId,
                        event: team.event,
                        ticketId: generateTicketId(),
                        status: 'Confirmed',
                        team: team._id
                    });
                }
            }

            // Update event registered count
            await Event.findByIdAndUpdate(team.event, {
                $inc: { registeredCount: team.members.length }
            });

            team.status = 'registered';
        }

        await team.save();
        await team.populate('members', 'firstName lastName email');
        await team.populate('event', 'name startDate endDate');

        res.json(team);
    } catch (err) {
        console.error('Join team error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get my teams
router.get('/my', protect, async (req, res) => {
    try {
        const teams = await Team.find({ members: req.user.id })
            .populate('members', 'firstName lastName email')
            .populate('event', 'name startDate endDate type')
            .populate('leader', 'firstName lastName email')
            .sort('-createdAt');

        res.json(teams);
    } catch (err) {
        console.error('Get teams error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get team by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('members', 'firstName lastName email')
            .populate('event', 'name startDate endDate type minTeamSize maxTeamSize')
            .populate('leader', 'firstName lastName email');

        if (!team) return res.status(404).json({ message: 'Team not found' });

        res.json(team);
    } catch (err) {
        console.error('Get team error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get teams for an event (for hackathon event details)
router.get('/event/:eventId', protect, async (req, res) => {
    try {
        const teams = await Team.find({ event: req.params.eventId })
            .populate('members', 'firstName lastName email')
            .populate('leader', 'firstName lastName email');

        res.json(teams);
    } catch (err) {
        console.error('Get event teams error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave a team
router.delete('/:id/leave', protect, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.status === 'registered') {
            return res.status(400).json({ message: 'Cannot leave a registered team' });
        }

        // Leader cannot leave (must delete team instead)
        if (team.leader.toString() === req.user.id) {
            return res.status(400).json({ message: 'Team leader cannot leave. Delete the team instead.' });
        }

        const remainingMembers = [];
        for (const m of team.members) {
            if (m.toString() !== req.user.id) {
                remainingMembers.push(m);
            }
        }
        team.members = remainingMembers;
        if (team.status === 'complete') team.status = 'forming';
        await team.save();

        res.json({ message: 'Left team successfully' });
    } catch (err) {
        console.error('Leave team error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a team (leader only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.leader.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only leader can delete the team' });
        }
        if (team.status === 'registered') {
            return res.status(400).json({ message: 'Cannot delete a registered team' });
        }

        await Team.findByIdAndDelete(req.params.id);
        res.json({ message: 'Team deleted' });
    } catch (err) {
        console.error('Delete team error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

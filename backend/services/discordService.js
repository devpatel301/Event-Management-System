const axios = require('axios');

/**
 * Sends a rich Discord embed when a new event is created.
 * Uses the global DISCORD_WEBHOOK_URL from environment.
 */
const sendEventCreatedNotification = async (event, organizerName, organizerId) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('Discord webhook not configured');
        return;
    }

    const clubLabel = organizerName
        ? `**${organizerName}**${organizerId ? ` (ID: \`${organizerId}\`)` : ''}`
        : 'an organizer';

    const feeText = event.fee && event.fee > 0 ? `Rs. ${event.fee}` : 'Free';
    const limitText = event.registrationLimit > 0 ? `${event.registrationLimit} participants` : 'Unlimited';
    const deadlineText = event.registrationDeadline
        ? new Date(event.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A';
    const startText = event.startDate
        ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A';

    try {
        await axios.post(webhookUrl, {
            embeds: [{
                title: `New Event Created: ${event.name}`,
                description: `${event.description ? event.description.slice(0, 200) + (event.description.length > 200 ? '...' : '') : 'No description provided.'}\n\nCreated by ${clubLabel}`,
                color: 0xff6a3d,
                fields: [
                    { name: 'Type', value: event.type || 'Normal', inline: true },
                    { name: 'Status', value: event.status || 'Draft', inline: true },
                    { name: 'Eligibility', value: event.eligibility || 'All', inline: true },
                    { name: 'Event Date', value: startText, inline: true },
                    { name: 'Reg. Deadline', value: deadlineText, inline: true },
                    { name: 'Fee', value: feeText, inline: true },
                    { name: 'Capacity', value: limitText, inline: true },
                ],
                footer: { text: `Felicity EMS • ${organizerName || 'Organizer'}` },
                timestamp: new Date().toISOString()
            }],
            username: 'Event Bot'
        });
        console.log('Discord event notification sent');
    } catch (error) {
        console.error('Discord webhook error:', error.message);
    }
};

module.exports = {
    sendEventCreatedNotification
};


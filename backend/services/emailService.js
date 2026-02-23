const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

let transporter;

function setupEmailService() {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('Email service initialized');
}

async function sendRegistrationConfirmation(user, event, ticketId, organizerName) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('Email not configured');
            return;
        }

        const clubName = organizerName || 'Event Organizer';

        // Generate QR code as PNG buffer for inline attachment (CID)
        const qrBuffer = await QRCode.toBuffer(JSON.stringify({ ticketId }), { width: 200, type: 'png' });

        const mailOptions = {
            from: `"${clubName}" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: `[${clubName}] Registration Confirmed - ${event.name}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2>Registration Successful!</h2>
                    <p>Hi <strong>${user.firstName}</strong>,</p>
                    <p>You have successfully registered for:</p>

                        <h3 style="margin-top:0;color:#ff6a3d;">${event.name}</h3>
                        <p style="margin:5px 0;"><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p style="margin:5px 0;"><strong>Ticket ID:</strong> <code style="background:#fff;padding:2px 6px;border-radius:3px;font-size:1.1em;">${ticketId}</code></p>

                    <p><strong>Your Entry QR Code</strong> (show this at the venue):</p>
                        <img src="cid:ticketqr" alt="Ticket QR Code" style="width:200px;height:200px;padding:4px;border-radius:6px;" />

                    <p style="color:#666;font-size:0.9em;">Please save this email and present the QR code at the entry. Your Ticket ID is <strong>${ticketId}</strong>.</p>

                    <p style="color:#888;font-size:0.85em;">See you at the event!<br /><strong>${clubName}</strong></p>
                </div>
            `,
            attachments: [
                {
                    filename: 'ticket-qr.png',
                    content: qrBuffer,
                    contentType: 'image/png',
                    cid: 'ticketqr'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.messageId);
        return true;
    } catch (error) {
        console.error('Email failed:', error.message);
        return false;
    }
}

async function sendEventReminder(user, event, ticketId, organizerName) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('Email not configured');
            return;
        }

        const clubName = organizerName || 'Event Organizer';

        const mailOptions = {
            from: `"${clubName}" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: `[${clubName}] Reminder: ${event.name} is coming up!`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
                    <h2 style="color:#333;">Event Reminder ⏰</h2>
                    <p>Hi <strong>${user.firstName}</strong>,</p>
                    <p>Don't forget — you're registered for:</p>
                    
                    <div style="background:#f8f9fa;border-left:4px solid #ff6a3d;padding:15px;margin:15px 0;border-radius:4px;">
                        <h3 style="margin-top:0;color:#ff6a3d;">${event.name}</h3>
                        <p style="margin:5px 0;"><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p style="margin:5px 0;"><strong>Time:</strong> ${new Date(event.startDate).toLocaleTimeString()}</p>
                        <p style="margin:5px 0;"><strong>Ticket ID:</strong> <code style="background:#fff;padding:2px 6px;border-radius:3px;">${ticketId}</code></p>
                    </div>

                    <p>Please bring your ticket (QR code or Ticket ID) to the event.</p>

                    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                    <p style="color:#888;font-size:0.85em;">See you there!<br /><strong>${clubName}</strong></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Reminder email sent');
        return true;
    } catch (error) {
        console.error('Reminder email failed:', error.message);
        return false;
    }
}

module.exports = {
    setupEmailService,
    sendRegistrationConfirmation,
    sendEventReminder
};

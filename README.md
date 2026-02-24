# Felicity Event Management System

creating events, registering, tracking attendance, team formation, feedback, etc. Built with the MERN stack.

---

## Libraries and Frameworks Used

### Frontend

**React 19**, **React Router 7**
Client-side routing. Used to implement role-based page navigation (different routes for admin, organizer, participant) without full page reloads.

**Vite**
Build tool and dev server. Chosen over Create React App because it is significantly faster at both dev startup and production builds. Hot module replacement is near-instant.

**html5-qrcode**
QR code scanning library. Used on the organizer attendance page to scan participant tickets using the device camera or an uploaded image. Chosen because it abstracts the camera API and works well in-browser without a backend scanning step.

**qrcode.react**
Renders QR codes as a canvas element. Used on the ticket page to display a scannable QR code containing the ticket ID. Lightweight and has no external dependencies.

### Backend

**Express 5**, **Mongoose 9**, **jsonwebtoken**
JWT creation and verification

**bcrypt**
Password hashing

**multer**
Multipart form data and file upload handling

**nodemailer**
Email sending. Used to send registration confirmation emails to participants. Configured with Gmail SMTP

**qrcode**
Server-side QR code generation. Used to generate a QR code image that is embedded in the registration confirmation email.

**cors**
Cross-origin resource sharing middleware. Required since the frontend (Vite dev server or Vercel) runs on a different origin than the backend.

**dotenv**
Loads environment variables from `.env`. Keeps credentials out of source code.

**axios**
HTTP client used on the backend for outgoing requests for discord webhook

---

## Advanced Features

### Tier A - Hackathon Team Registration + QR Scanner & Attendance Tracking

**Team Registration:** Hackathon events expose a team panel where participants create a team (invite code `TEAM-XXXXXX`) or join via code. Once all members join and register, status moves to `registered` and tickets are generated for all members. Team state lives in a separate `Team` collection to keep event documents lean. Invite codes are short enough to share verbally. Capacity is released if a team is deleted or a member leaves.

**QR Attendance:** Each registration gets a unique ticket ID rendered as a QR code (`qrcode.react`) on the Ticket page, encoding `{ ticketId, userId, eventId }`. Organizers scan via camera or image upload (`html5-qrcode`) — the decoded payload hits `POST /api/attendance/scan`, which stamps `attendance: true` and `attendedAt`. Duplicate scans return a `400`. Manual override is available for damaged codes. Live counts (total / scanned / pending) refresh after each scan. Validation is server-side; no external service is needed.

---

### Tier B - Organizer Password Reset Workflow + Team Chat

**Password Reset:** Organizer accounts are institutional, so self-service reset creates an accountability gap. Instead, organizers submit a reset request with a reason; admin approves or rejects with a comment. Approval auto-generates a 12-character password (hashed immediately, plain text returned once), shown to admin to share. Request history is preserved as an audit log.

**Team Chat:** Each team has a chat room (team members only). Messages support text, links (auto-detected by URL regex), and file attachments (`multer`). Typing indicators use a short-lived in-memory map pruned at read time.

---

### Tier C - Anonymous Feedback System

Participants submit a 1–5 star rating and optional comment after attending. Anonymity is enforced at the data layer. all organizer-facing routes use `.select('rating comment createdAt')`, so `user` is never returned even in raw API responses. The `user` field is retained only for duplicate-check purposes (`{ event, user }` uniqueness). Organizers see average rating (computed client-side) and can filter responses by star rating across all their events via server-side query params.

---

## Setup

### Backend
```
cd backend
npm install
```
Create a `.env` file in `backend/` with:
```
MONGODB_URI=you_db_url
JWT_SECRET=random_generated_key
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password
ALLOWED_ORIGIN=http://localhost:5173 #for localhost
DISCORD_WEBHOOK_URL=discord_webhook_url
```
Then run:
```
npm start
```
Backend runs on `http://localhost:5000`.

### Frontend
```
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

## Assumptions

- One admin account exists in the database
- SMTP credentials are for Gmail with an app password
- SMTP does not work on Render as port 587 is blocked
- File uploads (for chat and custom form fields) are stored locally in `backend/uploads/`
- The Discord webhook URL is assumed to be hard coded. so it behaves like a Evenets Announcement Bot
- Again discord webhooks are blocked on Render so test locally
# Felicity Event Management System

creating events, registering, tracking attendance, team formation, feedback, etc. Built with the MERN stack.

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
## Tech Stack

- **Frontend:** React 19, React Router 7, Vite
- **Backend:** Express 5, Mongoose 9, JWT, Multer, Nodemailer, QRCode
- **Database:** MongoDB
- **Deployment:** Vercel (frontend), Render(backend)

# QR-Based Smart Event Check-In & Attendance Analytics System

A full-stack TypeScript application for QR-based event check-in with real-time attendance analytics. Organizers manage events and scan attendee QR codes; participants receive instant check-in confirmations.

## Architecture

```
Participant
    ↓
Vercel frontend (React + Vite + TypeScript + Tailwind)
    ↓
Render backend (Node.js + Express + TypeScript)
    ↓
Supabase PostgreSQL

Organizer Scanner:
Camera → QR decode → POST /api/checkin → Render backend → Supabase
    ↓
checkins INSERT → Supabase Realtime → Organizer Dashboard (auto-refresh)
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase PostgreSQL |
| Auth | JWT, bcrypt |
| QR Generation | qrcode.react |
| QR Scanning | html5-qrcode |
| Realtime | Supabase Realtime |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: `3001`) | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default: `2h`) | No |
| `FRONTEND_URL` | Deployed Vercel URL for CORS | No |
| `NODE_ENV` | `development` or `production` | No |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL (for Realtime) | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (for Realtime) | Yes |

> ⚠️ **Security:** The frontend NEVER uses `SUPABASE_SERVICE_ROLE_KEY`. Only the anon/public key is used for Realtime subscriptions. The service role key must only exist in the backend environment.

## Local Development Setup

### Prerequisites

- Node.js v18+
- npm
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone <repo-url>
cd qr-event-checkin

# Backend
cd backend
cp .env.example .env
# Fill in Supabase credentials in .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
```

### 2. Database Setup

1. Go to **SQL Editor** in your Supabase dashboard
2. Run `database/schema.sql` to create tables
3. Run `database/seed.sql` to insert demo data

### 3. Start Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=2h`
   - `FRONTEND_URL=https://<your-vercel-domain>.vercel.app`
   - `NODE_ENV=production`
6. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Import your GitHub repo
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL=https://<your-render-domain>.onrender.com/api`
   - `VITE_SUPABASE_URL=<your-supabase-url>`
   - `VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>`
6. Deploy

### Post-Deployment

Update `FRONTEND_URL` in Render with your actual Vercel deployment URL to enable CORS.

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| GET | `/api/health/db` | Database connectivity | No |
| POST | `/api/auth/login` | User login (returns JWT) | No |
| GET | `/api/participant/me` | Participant profile + registration | PARTICIPANT |
| GET | `/api/organizer/dashboard` | Dashboard with attendance data | ORGANIZER |
| POST | `/api/checkin` | Check in an attendee by QR code | ORGANIZER |

## Authentication

JWT-based authentication with bcrypt password hashing.

1. Client sends `POST /api/auth/login` with email and password
2. Server verifies credentials against bcrypt hashes
3. Server returns a JWT containing user ID and role
4. Client stores the JWT in localStorage
5. Client sends `Authorization: Bearer <token>` on protected routes
6. Server middleware verifies JWT and enforces role-based access

**Role-Based Access Control:**
- `ORGANIZER` — Dashboard, scanner, check-in
- `PARTICIPANT` — Participant portal with QR code

## Demo Credentials

> ⚠️ **HACKATHON DEMO CREDENTIALS — NOT FOR PRODUCTION USE**

| Role | Email | Password |
|------|-------|----------|
| ORGANIZER | `organizer@demo.com` | `Organizer@123` |
| PARTICIPANT | `alice@demo.com` | `Participant@123` |
| PARTICIPANT | `bob@demo.com` | `Participant@123` |
| PARTICIPANT | `charlie@demo.com` | `Participant@123` |
| PARTICIPANT | `diana@demo.com` | `Participant@123` |
| PARTICIPANT | `eve@demo.com` | `Participant@123` |

All passwords are bcrypt-hashed in the database. Never store plaintext passwords.

## Running Tests

```bash
cd backend

# Build first
npm run build

# Phase 2 — Auth (11/11 expected)
node test-all.js

# Phase 3 — Participant (11/11 expected)
node test-phase3.js

# Phase 4 — Check-in Security (16/16 expected)
node test-phase4.js

# Phase 5 — Dashboard (16/16 expected)
node test-phase5.js
```

## Build Commands

```bash
# Backend — TypeScript check
cd backend && npx tsc --noEmit

# Backend — Production build
cd backend && npm run build

# Frontend — TypeScript check + build
cd frontend && npm run build
```

## Realtime Updates

The organizer dashboard subscribes to Supabase Realtime `INSERT` events on the `checkins` table. When a new check-in occurs:

1. Supabase fires a `postgres_changes` event
2. The frontend receives the event
3. The frontend re-fetches `GET /api/organizer/dashboard`
4. Dashboard displays fresh database-derived data

> Realtime is an enhancement. The manual **Refresh** button always works independently.

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the frontend
- Only the Supabase **anon** key is used client-side (for Realtime)
- Password hashes are **never** sent in API responses
- JWT secrets are **only** in backend environment
- CORS is restricted to known frontend origins in production
- All check-in creation goes through the authenticated backend
- Frontend cannot directly insert into `checkins`
- Database unique constraints prevent duplicate check-ins
- Server timestamps are used, not client timestamps

## Project Structure

```
qr-event-checkin/
├── frontend/                    # Vite React TypeScript app
│   ├── src/
│   │   ├── App.tsx              # Router setup
│   │   ├── main.tsx             # Entry point
│   │   ├── auth/                # Auth context & API
│   │   ├── components/          # QRScanner, ProtectedRoute
│   │   ├── config/              # Supabase client (Realtime)
│   │   └── pages/               # Login, OrganizerHome, ParticipantHome
│   ├── .env.example
│   └── package.json
├── backend/                     # Express TypeScript API
│   ├── src/
│   │   ├── server.ts            # Entry point
│   │   ├── app.ts               # Express app with CORS, routes
│   │   ├── config/              # env, supabase client
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # auth, authorize
│   │   ├── routes/              # Route definitions
│   │   ├── services/            # Business logic
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # JWT, password hashing
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql               # Table definitions
│   └── seed.sql                 # Demo data
├── .env.example                 # Combined env template
├── .gitignore
└── README.md
```

## License

Built for hackathon purposes.

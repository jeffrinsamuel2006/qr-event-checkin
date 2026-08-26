# QR Event Check-In & Attendance Analytics System

A hackathon project for QR-based smart event check-in with real-time attendance analytics. Organizers can manage events and scan attendee QR codes, while participants receive check-in confirmations.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase PostgreSQL |
| Deployment | Vercel (frontend), Render (backend) |

## Folder Structure

```
qr-event-checkin/
├── frontend/              # Vite React TypeScript app
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── auth/           # Authentication context & API
│   │   │   ├── AuthContext.tsx
│   │   │   ├── authApi.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── OrganizerHome.tsx
│   │       └── ParticipantHome.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/               # Express TypeScript API
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── supabase.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── health.ts
│   │   │   └── testAuth.ts
│   │   ├── controllers/
│   │   │   └── authController.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── authorize.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── jwt.ts
│   │       └── password.ts
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── schema.sql         # Table definitions and indexes
│   └── seed.sql           # Demo data with bcrypt hashes
├── README.md
├── .gitignore
└── .env.example
```

## Local Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- npm
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd qr-event-checkin
```

### 2. Frontend Setup

```bash
cd frontend
cp ../frontend/.env.example .env
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials in .env (see Environment Variables below)
npm install
npm run dev
```

The backend will be available at `http://localhost:3001`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) |
| `JWT_SECRET` | Secret for JWT token signing |
| `JWT_EXPIRES_IN` | JWT token expiration (default: `2h`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:3001/api`) |

**⚠️ Security:** The `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the frontend. It should only exist in the backend environment.

## Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** in the Supabase dashboard
4. Run the contents of `database/schema.sql` to create tables
5. Run the contents of `database/seed.sql` to insert demo data
6. Copy your **Project URL** and **Service Role Key** from **Settings → API**
7. Paste them into your `backend/.env` file

## Running the Application

### Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Backend

```bash
cd backend
npm run dev
```

The backend will be available at `http://localhost:3001`.

### TypeScript Check

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run typecheck
```

### Run Backend Tests

```bash
cd backend && node test-all.js
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| GET | `/api/health/db` | Database connectivity check | No |
| POST | `/api/auth/login` | User login (returns JWT) | No |
| GET | `/api/test/organizer` | Test organizer-only access | Yes (ORGANIZER) |
| GET | `/api/test/participant` | Test participant-only access | Yes (PARTICIPANT) |

## Authentication

This system uses JWT-based authentication with bcrypt password hashing.

### Authentication Flow

1. Client sends `POST /api/auth/login` with email and password
2. Server verifies credentials against bcrypt hashes in the database
3. Server returns a JWT containing user ID and role
4. Client stores the JWT in localStorage
5. Client includes `Authorization: Bearer <token>` header on protected requests
6. Server middleware verifies the JWT and enforces role-based access

### Role-Based Access Control

- **ORGANIZER** — Can access organizer-only routes
- **PARTICIPANT** — Can access participant-only routes
- Frontend route protection is for UX only; backend authorization is the real security boundary

## Demo Development Credentials

**⚠️ DEMO DEVELOPMENT CREDENTIALS — NOT FOR PRODUCTION**

| Role | Email | Password |
|------|-------|----------|
| ORGANIZER | `organizer@demo.com` | `Organizer@123` |
| PARTICIPANT | `alice@demo.com` | `Participant@123` |
| PARTICIPANT | `bob@demo.com` | `Participant@123` |
| PARTICIPANT | `charlie@demo.com` | `Participant@123` |
| PARTICIPANT | `diana@demo.com` | `Participant@123` |
| PARTICIPANT | `eve@demo.com` | `Participant@123` |

All passwords are stored as bcrypt hashes in the database. Never store plaintext passwords.

## License

This project was built for hackathon purposes.

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
│   │   │   └── health.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── schema.sql         # Table definitions and indexes
│   └── seed.sql           # Demo data
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

### Backend

```bash
cd backend
npm run dev
```

### TypeScript Check

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run typecheck
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/health/db` | Database connectivity check |

## License

This project was built for hackathon purposes.

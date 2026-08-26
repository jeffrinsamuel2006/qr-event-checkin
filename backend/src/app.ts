import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import participantRoutes from './routes/participant';
import checkinRoutes from './routes/checkin';
import organizerRoutes from './routes/organizer';
import testAuthRoutes from './routes/testAuth';

// Extend Error to include statusCode
interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins: string[] = [];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Always allow localhost for development
allowedOrigins.push('http://localhost:5173');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/test', testAuthRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err: HttpError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 400 ? 'Invalid request format' : 'Internal server error',
    ...(statusCode === 400 ? { result: undefined } : {}),
  });
});

export default app;

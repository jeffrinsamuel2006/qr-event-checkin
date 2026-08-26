import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { dashboardHandler } from '../controllers/organizerController';

const router = Router();

// GET /api/organizer/dashboard
router.get('/dashboard', authenticate, authorize('ORGANIZER'), dashboardHandler);

export default router;

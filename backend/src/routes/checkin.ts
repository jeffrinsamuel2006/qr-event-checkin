import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { checkinHandler } from '../controllers/checkinController';

const router = Router();

// POST /api/checkin
router.post('/', authenticate, authorize('ORGANIZER'), checkinHandler);

export default router;

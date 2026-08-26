import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { getMeHandler } from '../controllers/participantController';

const router = Router();

// GET /api/participant/me
router.get('/me', authenticate, authorize('PARTICIPANT'), getMeHandler);

export default router;

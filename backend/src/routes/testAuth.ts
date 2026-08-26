import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { AuthenticatedRequest } from '../types';

const router = Router();

// GET /api/test/organizer
router.get(
  '/organizer',
  authenticate,
  authorize('ORGANIZER'),
  (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Organizer access granted',
    });
  }
);

// GET /api/test/participant
router.get(
  '/participant',
  authenticate,
  authorize('PARTICIPANT'),
  (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Participant access granted',
    });
  }
);

export default router;

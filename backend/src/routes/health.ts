import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/health
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
  });
});

// GET /api/health/db
router.get('/db', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.error('Database health check failed:', error.message);
      return res.status(503).json({
        success: false,
        database: 'unavailable',
      });
    }

    res.status(200).json({
      success: true,
      database: 'connected',
    });
  } catch (err) {
    console.error('Database health check error:', err);
    res.status(503).json({
      success: false,
      database: 'unavailable',
    });
  }
});

export default router;

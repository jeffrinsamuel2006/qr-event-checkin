import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getDashboard, OrganizerError } from '../services/organizerService';

export async function dashboardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const result = await getDashboard();

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof OrganizerError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load attendance data',
    });
  }
}

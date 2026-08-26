import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getMyRegistration, ParticipantError } from '../services/participantService';

export async function getMeHandler(
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

    const result = await getMyRegistration(req.user.id);

    res.status(200).json({
      success: true,
      participant: result.participant,
      registration: result.registration,
    });
  } catch (error) {
    if (error instanceof ParticipantError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Participant API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

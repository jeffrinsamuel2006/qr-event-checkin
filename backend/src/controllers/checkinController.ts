import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { processCheckin, CheckinError } from '../services/checkinService';

export async function checkinHandler(
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

    // Input validation
    const body = req.body;
    
    // Must be an object with attendeeCode
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({
        success: false,
        message: 'Invalid request format',
      });
      return;
    }

    const rawCode = body.attendeeCode;

    // attendeeCode must be a non-empty string
    if (typeof rawCode !== 'string' || rawCode.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid attendee code',
      });
      return;
    }

    // Trim whitespace
    const attendeeCode = rawCode.trim();

    // Reject obviously malformed values
    if (attendeeCode.length > 50 || attendeeCode.length < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid attendee code',
      });
      return;
    }

    // Process check-in (organizer ID from JWT)
    const result = await processCheckin(attendeeCode, req.user.id);

    // Return result
    if (result.result === 'DUPLICATE') {
      res.status(409).json({
        success: false,
        message: result.message,
        result: result.result,
      });
      return;
    }

    // Success
    res.status(200).json({
      success: true,
      message: result.message,
      result: result.result,
      checkin: result.checkin,
    });
  } catch (error) {
    if (error instanceof CheckinError) {
      if (error.statusCode === 404) {
        res.status(404).json({
          success: false,
          message: error.message,
          result: 'UNKNOWN_ATTENDEE',
        });
        return;
      }

      if (error.statusCode === 409) {
        res.status(409).json({
          success: false,
          message: error.message,
          result: 'SERVER_ERROR',
        });
        return;
      }

      if (error.statusCode === 503) {
        res.status(503).json({
          success: false,
          message: error.message,
          result: 'SERVER_ERROR',
        });
        return;
      }

      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Check-in service temporarily unavailable',
      result: 'SERVER_ERROR',
    });
  }
}

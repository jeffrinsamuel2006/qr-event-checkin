import { supabase } from '../config/supabase';

// Scan result types matching database constraint
export type ScanResult = 'SUCCESS' | 'DUPLICATE' | 'UNKNOWN_ATTENDEE' | 'SERVER_ERROR';

interface AttendeeData {
  id: string;
  event_id: string;
  user_id: string;
  attendee_code: string;
  events: {
    id: string;
    name: string;
    status: string;
  };
}

interface CheckinResult {
  success: boolean;
  result: ScanResult;
  message: string;
  checkin?: {
    id: string;
    attendeeCode: string;
    eventId: string;
    checkedInAt: string;
  };
}

export class CheckinError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'CheckinError';
    this.statusCode = statusCode;
  }
}

export async function processCheckin(
  attendeeCode: string,
  organizerId: string
): Promise<CheckinResult> {
  // Step 1: Look up the attendee
  const { data: attendee, error: attendeeError } = await supabase
    .from('attendees')
    .select(`
      id,
      event_id,
      user_id,
      attendee_code,
      events (
        id,
        name,
        status
      )
    `)
    .eq('attendee_code', attendeeCode)
    .single();

  // Unknown attendee
  if (attendeeError || !attendee) {
    // Log the scan attempt
    await logScan({
      eventId: null,
      code: attendeeCode,
      result: 'UNKNOWN_ATTENDEE',
      scannedBy: organizerId,
    });

    throw new CheckinError('Unknown attendee code', 404);
  }

  const attendeeData = attendee as unknown as AttendeeData;
  const eventData = attendeeData.events;

  // Step 2: Validate event status (only ACTIVE events accept check-ins)
  if (eventData.status !== 'ACTIVE') {
    await logScan({
      eventId: eventData.id,
      code: attendeeCode,
      result: 'SERVER_ERROR',
      scannedBy: organizerId,
    });

    throw new CheckinError('Event is not active for check-in', 409);
  }

  // Step 3: Attempt check-in (rely on UNIQUE constraint for duplicate prevention)
  const { data: checkin, error: checkinError } = await supabase
    .from('checkins')
    .insert({
      event_id: eventData.id,
      attendee_id: attendeeData.id,
      scanned_by: organizerId,
      // checked_in_at uses database DEFAULT now()
    })
    .select('id, event_id, checked_in_at')
    .single();

  // Handle insert result
  if (checkinError) {
    // Check if this is a unique constraint violation (duplicate)
    if (checkinError.code === '23505') {
      // PostgreSQL unique constraint violation = duplicate check-in
      await logScan({
        eventId: eventData.id,
        code: attendeeCode,
        result: 'DUPLICATE',
        scannedBy: organizerId,
      });

      return {
        success: false,
        result: 'DUPLICATE',
        message: 'Attendee already checked in',
      };
    }

    // Other database error
    await logScan({
      eventId: eventData.id,
      code: attendeeCode,
      result: 'SERVER_ERROR',
      scannedBy: organizerId,
    });

    throw new CheckinError('Check-in service temporarily unavailable', 503);
  }

  // Step 4: Success - log it
  await logScan({
    eventId: eventData.id,
    code: attendeeCode,
    result: 'SUCCESS',
    scannedBy: organizerId,
  });

  return {
    success: true,
    result: 'SUCCESS',
    message: 'Check-in successful',
    checkin: {
      id: checkin.id,
      attendeeCode: attendeeCode,
      eventId: checkin.event_id,
      checkedInAt: checkin.checked_in_at,
    },
  };
}

async function logScan(params: {
  eventId: string | null;
  code: string;
  result: ScanResult;
  scannedBy: string;
}): Promise<void> {
  try {
    await supabase
      .from('scan_logs')
      .insert({
        event_id: params.eventId,
        code: params.code,
        result: params.result,
        scanned_by: params.scannedBy,
        // created_at uses database DEFAULT now()
      });
  } catch {
    // Scan logging failure - don't fail the main operation
    console.error('Failed to log scan:', params);
  }
}

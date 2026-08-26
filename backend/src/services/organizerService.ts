import { supabase } from '../config/supabase';

interface EventData {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  status: string;
}

interface CheckedInAttendee {
  attendeeId: string;
  name: string;
  attendeeCode: string;
  checkedInAt: string;
  scannedBy: string;
}

interface DashboardResponse {
  success: boolean;
  event: EventData;
  attendance: {
    totalRegistered: number;
    totalCheckedIn: number;
    remaining: number;
    percentage: number;
  };
  checkedInAttendees: CheckedInAttendee[];
}

export class OrganizerError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'OrganizerError';
    this.statusCode = statusCode;
  }
}

export async function getDashboard(): Promise<DashboardResponse> {
  // Step 1: Find the active event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, description, event_date, status')
    .eq('status', 'ACTIVE')
    .single();

  if (eventError || !event) {
    throw new OrganizerError('No active event found', 404);
  }

  const eventData = event as EventData;

  // Step 2: Count total registered attendees for this event
  const { count: totalRegistered, error: regError } = await supabase
    .from('attendees')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventData.id);

  if (regError) {
    console.error('Error counting attendees:', regError);
    throw new OrganizerError('Unable to load attendance data', 503);
  }

  // Step 3: Count total checked-in attendees for this event
  const { count: totalCheckedIn, error: checkinError } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventData.id);

  if (checkinError) {
    console.error('Error counting checkins:', checkinError);
    throw new OrganizerError('Unable to load attendance data', 503);
  }

  const registered = totalRegistered || 0;
  const checkedIn = totalCheckedIn || 0;
  const remaining = registered - checkedIn;
  const percentage = registered > 0 ? Math.round((checkedIn / registered) * 100) : 0;

  // Step 4: Get checked-in attendee list (ordered newest first)
  const { data: checkinRows, error: listError } = await supabase
    .from('checkins')
    .select(`
      id,
      attendee_id,
      checked_in_at,
      scanned_by,
      attendees (
        id,
        attendee_code,
        user_id,
        users:user_id (
          name
        )
      ),
      scanner:scanned_by (
        name
      )
    `)
    .eq('event_id', eventData.id)
    .order('checked_in_at', { ascending: false });

  if (listError) {
    console.error('Error fetching checkin list:', listError);
    throw new OrganizerError('Unable to load attendance data', 503);
  }

  // Transform the joined data
  const checkedInAttendees: CheckedInAttendee[] = (checkinRows || []).map((row: Record<string, unknown>) => {
    const attendee = row.attendees as Record<string, unknown> | null;
    const users = attendee?.users as Record<string, unknown> | null;
    const scanner = row.scanner as Record<string, unknown> | null;

    return {
      attendeeId: row.attendee_id as string,
      name: (users?.name as string) || 'Unknown',
      attendeeCode: (attendee?.attendee_code as string) || 'Unknown',
      checkedInAt: row.checked_in_at as string,
      scannedBy: (scanner?.name as string) || 'Unknown',
    };
  });

  return {
    success: true,
    event: eventData,
    attendance: {
      totalRegistered: registered,
      totalCheckedIn: checkedIn,
      remaining,
      percentage,
    },
    checkedInAttendees,
  };
}

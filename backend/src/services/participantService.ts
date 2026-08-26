import { supabase } from '../config/supabase';

interface ParticipantUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EventData {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  status: string;
}

interface AttendeeRow {
  id: string;
  attendee_code: string;
  registered_at: string;
  event_id: string;
  events: EventData;
}

interface ParticipantRegistration {
  participant: ParticipantUser;
  registration: {
    attendeeId: string;
    attendeeCode: string;
    registeredAt: string;
    event: {
      id: string;
      name: string;
      description: string | null;
      eventDate: string;
      status: string;
    };
  };
}

export async function getMyRegistration(
  userId: string
): Promise<ParticipantRegistration> {
  // Query user (never return password_hash)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new ParticipantError('User not found', 404);
  }

  const participantUser = user as ParticipantUser;

  // Query attendee record joined with event
  const { data: attendee, error: attendeeError } = await supabase
    .from('attendees')
    .select(`
      id,
      attendee_code,
      registered_at,
      event_id,
      events (
        id,
        name,
        description,
        event_date,
        status
      )
    `)
    .eq('user_id', userId)
    .single();

  if (attendeeError || !attendee) {
    throw new ParticipantError('No event registration found', 404);
  }

  const attendeeRow = attendee as unknown as AttendeeRow;
  const eventData = attendeeRow.events;

  return {
    participant: participantUser,
    registration: {
      attendeeId: attendeeRow.id,
      attendeeCode: attendeeRow.attendee_code,
      registeredAt: attendeeRow.registered_at,
      event: {
        id: eventData.id,
        name: eventData.name,
        description: eventData.description,
        eventDate: eventData.event_date,
        status: eventData.status,
      },
    },
  };
}

export class ParticipantError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ParticipantError';
    this.statusCode = statusCode;
  }
}

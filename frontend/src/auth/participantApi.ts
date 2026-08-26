const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ParticipantUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface EventData {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  status: string;
}

export interface Registration {
  attendeeId: string;
  attendeeCode: string;
  registeredAt: string;
  event: EventData;
}

export interface ParticipantResponse {
  success: boolean;
  participant: ParticipantUser;
  registration: Registration;
}

export interface ParticipantError {
  success: boolean;
  message: string;
}

export async function getParticipantMe(token: string): Promise<ParticipantResponse> {
  const response = await fetch(`${API_BASE_URL}/api/participant/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as ParticipantError;
    throw new ParticipantApiError(errorData.message || 'Failed to load participant data', response.status);
  }

  return data as ParticipantResponse;
}

export class ParticipantApiError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ParticipantApiError';
    this.status = status;
  }
}

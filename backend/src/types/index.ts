import { Request } from 'express';

export type UserRole = 'ORGANIZER' | 'PARTICIPANT';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

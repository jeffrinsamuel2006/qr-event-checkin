export type UserRole = 'ORGANIZER' | 'PARTICIPANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface LoginError {
  success: boolean;
  message: string;
}

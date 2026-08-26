import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  role: 'ORGANIZER' | 'PARTICIPANT';
}

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    return 7200; // default 2 hours in seconds
  }
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 7200;
  }
}

export function generateToken(user: { id: string; role: 'ORGANIZER' | 'PARTICIPANT' }): string {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
  };

  const expiresIn = parseExpiresIn(env.JWT_EXPIRES_IN);

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

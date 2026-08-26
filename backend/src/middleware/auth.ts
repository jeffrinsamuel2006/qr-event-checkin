import { Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  try {
    const decoded: JwtPayload = verifyToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
}

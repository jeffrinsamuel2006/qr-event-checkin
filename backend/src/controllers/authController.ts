import { Request, Response } from 'express';
import { login, AuthError } from '../services/authService';
import { LoginRequestBody } from '../types';

export async function loginHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequestBody;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Invalid request format',
      });
      return;
    }

    const result = await login(email, password);

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

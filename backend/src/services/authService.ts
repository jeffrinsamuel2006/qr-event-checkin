import { supabase } from '../config/supabase';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { SafeUser, UserRole } from '../types';

interface AuthResult {
  token: string;
  user: SafeUser;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  // Query user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash, role')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new AuthError('Invalid email or password');
  }

  // Verify password
  const userRow = user as UserRow;
  const validPassword = await comparePassword(password, userRow.password_hash);

  if (!validPassword) {
    throw new AuthError('Invalid email or password');
  }

  // Generate JWT
  const token = generateToken({
    id: userRow.id,
    role: userRow.role,
  });

  // Return safe user info (never include password_hash)
  const safeUser: SafeUser = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
  };

  return { token, user: safeUser };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

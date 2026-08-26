import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
  NODE_ENV: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

function validateEnv(): EnvConfig {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file. See .env.example for required variables.');
    process.exit(1);
  }

  return {
    PORT: process.env.PORT || '3001',
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

export const env = validateEnv();

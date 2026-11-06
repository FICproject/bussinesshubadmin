import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // fallback to default lookup

export const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || '0.0.0.0',

  // Database configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fic_business_hub',
  dbTimeoutMs: Number(process.env.MONGODB_TIMEOUT_MS) || 2500,

  // Security & Authentication
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
    ? (() => { throw new Error('FATAL: JWT_SECRET environment variable must be set in production!'); })() 
    : 'fic_hub_dev_jwt_secret_change_in_production_key_2026'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

  // CORS Allowed Origins
  corsOrigins: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3001'],

  // Initial Super Admin Seed Credentials
  seed: {
    superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@ficapp.in',
    superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || 'admin123',
  },

  // Storage / Persistence configuration
  persistentSnapshotDir: process.env.PERSISTENCE_DIR || '',
};


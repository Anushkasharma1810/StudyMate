import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ---------------- JWT secret ----------------
// Signs every login token. It must be secret: anyone who knows it can forge a login for any user.
// Production: must be set in the host's environment variables (never committed to git).
// Development: if missing, a random one is generated (you just get logged out on restart).
function resolveJwtSecret(): string {
  const fromEnv = (process.env.JWT_SECRET || '').trim();
  if (fromEnv.length >= 32) return fromEnv;

  if (IS_PRODUCTION) {
    throw new Error(
      'JWT_SECRET is missing or too short (min 32 characters). ' +
      'Set it in your hosting environment variables. Generate one with: ' +
      `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }
  if (fromEnv) {
    console.warn('⚠️  JWT_SECRET is shorter than 32 characters — fine for local dev, but use a long random value in production.');
    return fromEnv;
  }
  console.warn('⚠️  JWT_SECRET not set — using a random development secret (you will be logged out when the server restarts).');
  return crypto.randomBytes(48).toString('hex');
}

export const JWT_SECRET = resolveJwtSecret();

// ---------------- Storage locations ----------------
// On a host, point these at a persistent disk/volume so data survives restarts and redeploys,
// e.g. DATA_DIR=/data/db and UPLOADS_DIR=/data/uploads (with a volume mounted at /data).
export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'));

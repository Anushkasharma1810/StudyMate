import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { JWT_SECRET } from '../config.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/** Returns the user encoded in a valid Bearer token whose account still exists, else null. */
export function getUserFromRequest(req: Request): { id: string; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { id: string; email: string };
    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.id);
    return exists ? { id: decoded.id, email: decoded.email } : null;
  } catch {
    return null;
  }
}

// Every request must carry a valid token. Visitors without an account get their own
// private guest token from POST /api/auth/guest, so nobody shares a workspace.
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired. Please refresh the page.' });
  }
  req.user = user;
  next();
}

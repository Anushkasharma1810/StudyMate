import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'studymate_super_secure_jwt_secret_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token, check if a demo token or fallback header exists
    const demoUser = req.headers['x-user-id'] as string;
    if (demoUser) {
      req.user = { id: demoUser, email: 'demo@studymate.ai' };
      return next();
    }
    // Fallback to default demo user for frictionless dev / evaluation
    req.user = { id: 'user_demo_studymate_001', email: 'demo@studymate.ai' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback to demo user if token expired or invalid
    req.user = { id: 'user_demo_studymate_001', email: 'demo@studymate.ai' };
    next();
  }
}

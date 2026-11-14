import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { AuthRequest, authMiddleware, getUserFromRequest } from '../middleware/auth.js';
import { isAiConfigured } from '../services/aiService.js';
import { JWT_SECRET } from '../config.js';
import { authLimiter, guestLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Create a fresh, private, empty guest workspace for a visitor without an account
router.post('/guest', guestLimiter, (_req, res: Response) => {
  try {
    const suffix = Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const userId = 'guest_' + suffix;
    const email = `${userId}@guest.studymate.local`;
    // Random unusable password: guests can't log in with credentials, only via their token
    const hash = bcrypt.hashSync(Math.random().toString(36) + Date.now(), 8);

    db.prepare('INSERT INTO users (id, name, email, password_hash, is_guest) VALUES (?, ?, ?, ?, 1)').run(userId, 'Guest Student', email, hash);
    db.prepare('INSERT INTO user_preferences (user_id, theme, language, ai_provider) VALUES (?, ?, ?, ?)').run(userId, 'light', 'en', 'gemini');

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: userId, name: 'Guest Student', email, isGuest: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Could not start a guest session' });
  }
});

// Sign up
router.post('/signup', authLimiter, (req, res: Response) => {
  try {
    const { name, password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);

    // If the visitor was using a guest workspace, upgrade it so their work carries over
    const current = getUserFromRequest(req);
    const guest: any = current
      ? db.prepare('SELECT id FROM users WHERE id = ? AND is_guest = 1').get(current.id)
      : null;

    let userId: string;
    if (guest) {
      userId = guest.id;
      db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, is_guest = 0 WHERE id = ?').run(name, email, hash, userId);
    } else {
      userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(userId, name, email, hash);
      db.prepare('INSERT INTO user_preferences (user_id, theme, language, ai_provider) VALUES (?, ?, ?, ?)').run(userId, 'light', 'en', 'gemini');
    }

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email, isGuest: false }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// Login
router.post('/login', authLimiter, (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user: any = db
      .prepare('SELECT id, name, email, password_hash FROM users WHERE lower(email) = ? AND is_guest = 0')
      .get(String(email).trim().toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, isGuest: false }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const row: any = db.prepare('SELECT id, name, email, is_guest, created_at FROM users WHERE id = ?').get(req.user!.id);
    if (!row) {
      return res.status(401).json({ error: 'User not found' });
    }
    const { is_guest, ...rest } = row;
    const user = { ...rest, isGuest: Boolean(is_guest) };

    const pref: any = db.prepare('SELECT theme, language FROM user_preferences WHERE user_id = ?').get(user.id);

    res.json({
      user,
      preferences: {
        theme: pref?.theme || 'light',
        language: pref?.language || 'en',
        aiAvailable: isAiConfigured()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update preferences (Theme, Language). AI is configured server-side only.
router.put('/preferences', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let { theme, language } = req.body;

    // Validate theme
    if (theme && !['light', 'dark'].includes(theme)) {
      theme = 'light';
    }

    // Validate language
    if (language && !['en', 'hi', 'hinglish'].includes(language)) {
      language = 'en';
    }

    const existing: any = db.prepare('SELECT user_id, theme, language FROM user_preferences WHERE user_id = ?').get(userId);

    const finalTheme = theme || existing?.theme || 'light';
    const finalLanguage = language || existing?.language || 'en';

    if (existing) {
      db.prepare(`
        UPDATE user_preferences
        SET theme = ?,
            language = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(finalTheme, finalLanguage, userId);
    } else {
      db.prepare(`
        INSERT INTO user_preferences (user_id, theme, language)
        VALUES (?, ?, ?)
      `).run(userId, finalTheme, finalLanguage);
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        theme: finalTheme,
        language: finalLanguage,
        aiAvailable: isAiConfigured()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account & all data
router.delete('/account', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId === 'user_demo_studymate_001') {
      return res.status(400).json({ error: 'Demo account cannot be deleted, but you can reset its data.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ success: true, message: 'Account and associated data deleted permanently' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

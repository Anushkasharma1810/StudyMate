import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'studymate_super_secure_jwt_secret_key_2026';

// Sign up
router.post('/signup', (req, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const hash = bcrypt.hashSync(password, 10);

    db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(userId, name, email, hash);
    db.prepare('INSERT INTO user_preferences (user_id, theme, language, ai_provider) VALUES (?, ?, ?, ?)').run(userId, 'light', 'en', 'gemini');

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// Login
router.post('/login', (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user: any = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// One-click demo login
router.post('/demo-login', (_req, res: Response) => {
  try {
    const user: any = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get('demo@studymate.ai');
    if (!user) {
      return res.status(404).json({ error: 'Demo user not seeded' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo login failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    let user: any = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get('user_demo_studymate_001');
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pref: any = db.prepare('SELECT theme, language, ai_provider, api_key_override FROM user_preferences WHERE user_id = ?').get(user.id);
    const key = (pref?.api_key_override || '').trim();

    res.json({
      user,
      preferences: {
        theme: pref?.theme || 'light',
        language: pref?.language || 'en',
        aiProvider: pref?.ai_provider || 'gemini',
        hasApiKeyOverride: Boolean(key && key.length > 0),
        keyPreview: key && key.length > 4 ? `••••••••${key.slice(-4)}` : undefined
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update preferences (Theme, Language, AI Provider, API Key Override)
router.put('/preferences', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    let { theme, language, aiProvider, apiKeyOverride } = req.body;

    // Validate aiProvider
    if (aiProvider && !['gemini', 'openai'].includes(aiProvider)) {
      return res.status(400).json({ error: "Invalid AI provider. Must be 'gemini' or 'openai'." });
    }

    // Validate theme
    if (theme && !['light', 'dark'].includes(theme)) {
      theme = 'light';
    }

    // Validate language
    if (language && !['en', 'hi', 'hinglish'].includes(language)) {
      language = 'en';
    }

    const existing: any = db.prepare('SELECT user_id, theme, language, ai_provider, api_key_override FROM user_preferences WHERE user_id = ?').get(userId);

    const finalTheme = theme || existing?.theme || 'light';
    const finalLanguage = language || existing?.language || 'en';
    const finalProvider = aiProvider || existing?.ai_provider || 'gemini';
    
    // Parse key override: if undefined, keep existing. If empty string or null, allow clear. If non-empty, update.
    let finalApiKey = existing?.api_key_override || '';
    if (apiKeyOverride !== undefined) {
      finalApiKey = typeof apiKeyOverride === 'string' ? apiKeyOverride.trim() : '';
    }

    if (existing) {
      db.prepare(`
        UPDATE user_preferences
        SET theme = ?,
            language = ?,
            ai_provider = ?,
            api_key_override = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(finalTheme, finalLanguage, finalProvider, finalApiKey, userId);
    } else {
      db.prepare(`
        INSERT INTO user_preferences (user_id, theme, language, ai_provider, api_key_override)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, finalTheme, finalLanguage, finalProvider, finalApiKey);
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        theme: finalTheme,
        language: finalLanguage,
        aiProvider: finalProvider,
        hasApiKeyOverride: Boolean(finalApiKey && finalApiKey.length > 0),
        keyPreview: finalApiKey && finalApiKey.length > 4 ? `••••••••${finalApiKey.slice(-4)}` : undefined
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

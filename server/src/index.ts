import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import noteRoutes from './routes/notes.js';
import chatRoutes from './routes/chat.js';
import quizRoutes from './routes/quizzes.js';
import flashcardRoutes from './routes/flashcards.js';
import plannerRoutes from './routes/planner.js';
import toolRoutes from './routes/tools.js';
import analyticsRoutes from './routes/analytics.js';
import { authMiddleware } from './middleware/auth.js';
import { IS_PRODUCTION, DATA_DIR, UPLOADS_DIR } from './config.js';
import { isAiConfigured } from './services/aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Hosts like Railway/Render sit behind a proxy; trust it so req.ip is the real visitor IP
// (needed for per-IP rate limits).
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Initialize SQLite database
initDatabase();

// Middleware
// In production the frontend is served by this same server (same origin), so CORS is only
// needed for local development or if CORS_ORIGIN is set explicitly.
app.use(cors({
  origin: process.env.CORS_ORIGIN || (IS_PRODUCTION ? false : '*'),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check (used by the host to know the app is up)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'StudyMate — AI Study Assistant API',
    timestamp: new Date().toISOString(),
    aiReady: isAiConfigured()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/notes', authMiddleware, noteRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/quizzes', authMiddleware, quizRoutes);
app.use('/api/flashcards', authMiddleware, flashcardRoutes);
app.use('/api/planner', authMiddleware, plannerRoutes);
app.use('/api/tools', authMiddleware, toolRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Serve static frontend in production if built
const clientDist = path.resolve(process.cwd(), 'client', 'dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('StudyMate API server is running. Start the Vite client dev server or run `npm run build:client`.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 StudyMate Backend Server is running on port ${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'} (${isAiConfigured() ? 'key configured' : '⚠️ NO KEY — set GEMINI_API_KEY'})`);
  console.log(`💾 Database dir: ${DATA_DIR}`);
  console.log(`📁 Uploads dir:  ${UPLOADS_DIR}`);
  console.log(`🌍 Mode: ${IS_PRODUCTION ? 'production' : 'development'}`);
  console.log(`=======================================================`);
});

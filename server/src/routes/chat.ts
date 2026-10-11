import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { retrieveRelevantChunks } from '../services/ragService.js';
import { answerPdfQuestion } from '../services/aiService.js';

const router = Router();

// Create or get chat session
router.post('/sessions', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { documentId, title } = req.body;

    const sessionId = 'cs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const sessionTitle = title || 'Document Q&A';

    if (documentId) {
      const doc: any = db.prepare('SELECT id FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found or access denied.' });
      }
    }

    db.prepare(`
      INSERT INTO chat_sessions (id, user_id, document_id, title)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, userId, documentId || null, sessionTitle);

    res.status(201).json({
      session: {
        id: sessionId,
        documentId,
        title: sessionTitle
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List sessions
router.get('/sessions', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const documentId = req.query.documentId as string;

    let query = `
      SELECT cs.*, d.title as document_title
      FROM chat_sessions cs
      LEFT JOIN documents d ON cs.document_id = d.id
      WHERE cs.user_id = ?
    `;
    const params: any[] = [userId];

    if (documentId) {
      query += ` AND cs.document_id = ?`;
      params.push(documentId);
    }

    query += ` ORDER BY cs.updated_at DESC`;

    const sessions = db.prepare(query).all(...params);
    res.json({ sessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get session messages
router.get('/sessions/:id/messages', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const sessionId = req.params.id;

    const session: any = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = db.prepare(`
      SELECT id, role, content, source_pages, created_at
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).all(sessionId);

    res.json({
      session,
      messages: messages.map((m: any) => ({
        ...m,
        sourcePages: m.source_pages ? JSON.parse(m.source_pages) : []
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Post message & get grounded RAG response
router.post('/sessions/:id/message', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const sessionId = req.params.id;
    const { message, language = 'en' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const session: any = db.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Save user message
    const userMsgId = 'msg_' + Date.now() + '_u';
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(userMsgId, sessionId, message);

    // Retrieve previous messages for conversation context
    const previousMessages: any[] = db.prepare(`
      SELECT role, content FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 6
    `).all(sessionId);
    previousMessages.reverse();

    // RAG Retrieval over document
    let retrievedChunks: any[] = [];
    let docTitle = 'Study Material';

    if (session.document_id) {
      const doc: any = db.prepare('SELECT title FROM documents WHERE id = ?').get(session.document_id);
      if (doc) docTitle = doc.title;

      retrievedChunks = retrieveRelevantChunks([session.document_id], message, 4);
    } else {
      // If no single doc, search all documents belonging to user
      const userDocs: any[] = db.prepare('SELECT id FROM documents WHERE user_id = ?').all(userId);
      const docIds = userDocs.map(d => d.id);
      if (docIds.length > 0) {
        retrievedChunks = retrieveRelevantChunks(docIds, message, 4);
      }
    }

    // Answer grounded in retrieved chunks
    const response = await answerPdfQuestion(
      docTitle,
      retrievedChunks,
      message,
      previousMessages,
      language,
      userId
    );

    // Save assistant message
    const assistantMsgId = 'msg_' + Date.now() + '_a';
    db.prepare(`
      INSERT INTO chat_messages (id, session_id, role, content, source_pages)
      VALUES (?, ?, 'assistant', ?, ?)
    `).run(assistantMsgId, sessionId, response.answer, JSON.stringify(response.sourcePages));

    // Update session timestamp
    db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);

    res.json({
      userMessage: {
        id: userMsgId,
        role: 'user',
        content: message
      },
      assistantMessage: {
        id: assistantMsgId,
        role: 'assistant',
        content: response.answer,
        sourcePages: response.sourcePages,
        suggestedQuestions: response.suggestedQuestions,
        isAi: response.isAi,
        warning: response.warning
      }
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message' });
  }
});

export default router;

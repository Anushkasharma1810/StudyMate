import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateNotes, executeAiPrompt, getAiConfigForUser } from '../services/aiService.js';

const router = Router();

// Generate new notes from a document
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const {
      documentId,
      noteType = 'detailed',
      length = 'balanced',
      language = 'en',
      learningLevel = 'college',
      includeExamples = true,
      highlightDefinitions = true,
      highlightFormulas = true,
      generatePracticeQuestions = true,
      pageRange
    } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const doc: any = db.prepare('SELECT id, title, user_id FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    // Retrieve chunks (optionally filter by page range)
    let chunks: any[] = [];
    if (pageRange && pageRange.start && pageRange.end) {
      chunks = db.prepare(`
        SELECT content, page_number FROM document_chunks
        WHERE document_id = ? AND page_number >= ? AND page_number <= ?
        ORDER BY page_number ASC, chunk_index ASC
      `).all(documentId, pageRange.start, pageRange.end);
    } else {
      chunks = db.prepare(`
        SELECT content, page_number FROM document_chunks
        WHERE document_id = ?
        ORDER BY page_number ASC, chunk_index ASC
      `).all(documentId);
    }

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No text chunks found for this document.' });
    }

    const combinedText = chunks.map(c => `[Page ${c.pageNumber}]\n${c.content}`).join('\n\n');

    const generated = await generateNotes(
      doc.title,
      combinedText,
      {
        noteType,
        length,
        language,
        learningLevel,
        includeExamples,
        highlightDefinitions,
        highlightFormulas,
        generatePracticeQuestions
      },
      userId
    );

    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const title = `${doc.title} - ${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Notes`;

    db.prepare(`
      INSERT INTO notes (
        id, user_id, document_id, title, note_type, language, learning_level, content, source_refs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      noteId,
      userId,
      documentId,
      title,
      noteType,
      language,
      learningLevel,
      generated.content,
      JSON.stringify(Array.from(new Set(chunks.map(c => c.page_number))))
    );

    res.status(201).json({
      note: {
        id: noteId,
        documentId,
        title,
        noteType,
        language,
        learningLevel,
        content: generated.content,
        isAi: generated.isAi,
        warning: generated.warning
      }
    });
  } catch (err: any) {
    console.error('Note generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate notes' });
  }
});

// List user notes
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const notes = db.prepare(`
      SELECT n.id, n.title, n.note_type, n.language, n.learning_level, n.document_id,
             n.created_at, n.updated_at, d.title as document_title, d.subject
      FROM notes n
      LEFT JOIN documents d ON n.document_id = d.id
      WHERE n.user_id = ?
      ORDER BY n.updated_at DESC
    `).all(userId);

    res.json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get note by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const note: any = db.prepare(`
      SELECT n.*, d.title as document_title
      FROM notes n
      LEFT JOIN documents d ON n.document_id = d.id
      WHERE n.id = ? AND n.user_id = ?
    `).get(req.params.id, userId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ note });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update/Autosave note
router.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { title, content } = req.body;

    const existing: any = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    db.prepare(`
      UPDATE notes
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, content, req.params.id);

    res.json({ success: true, message: 'Note saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete note
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Note deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Transform selected section (shorten, expand, simplify, generate examples)
router.post('/transform', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { action, text } = req.body;

    if (!text || !action) {
      return res.status(400).json({ error: 'action and text are required' });
    }

    const config = getAiConfigForUser(userId);
    let instruction = '';
    if (action === 'simplify') {
      instruction = 'Rewrite this text in very simple, easy-to-understand language. Use a clear analogy.';
    } else if (action === 'shorten') {
      instruction = 'Condense this text into a concise 2-3 bullet point summary retaining only the essential facts.';
    } else if (action === 'expand') {
      instruction = 'Expand on this concept with deeper academic detail, mechanisms, and nuances.';
    } else if (action === 'examples') {
      instruction = 'Provide two vivid, concrete real-world examples illustrating this exact concept.';
    } else {
      instruction = 'Improve and clarify this explanation.';
    }

    try {
      const result = await executeAiPrompt(text, instruction, config);
      res.json({ result: result.text, isAi: true });
    } catch {
      // Heuristic transformation fallback
      if (action === 'shorten') {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        res.json({ result: sentences.slice(0, 2).join(' '), isAi: false });
      } else if (action === 'simplify') {
        res.json({ result: `**Simplified:** ${text}\n\n*Think of this like a real-world system where each component works together harmoniously.*`, isAi: false });
      } else if (action === 'examples') {
        res.json({ result: `**Example 1:** Standard engineering/practical case study.\n**Example 2:** Daily life analogy showcasing the core mechanism.`, isAi: false });
      } else {
        res.json({ result: text + '\n\n*(Further details and sub-components applied in advanced scenarios)*', isAi: false });
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

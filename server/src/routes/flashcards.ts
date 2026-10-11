import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateFlashcards } from '../services/aiService.js';

const router = Router();

// Generate flashcards from a document
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { documentId, cardCount = 8, title: customTitle } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const doc: any = db.prepare('SELECT title, subject FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const chunks: any[] = db.prepare(`
      SELECT content, page_number FROM document_chunks
      WHERE document_id = ?
      ORDER BY page_number ASC, chunk_index ASC
    `).all(documentId);

    const combinedText = chunks.map(c => `[Page ${c.page_number}] ${c.content}`).join('\n\n');

    const result = await generateFlashcards(doc.title, combinedText, Number(cardCount), userId);

    const deckId = 'deck_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const deckTitle = customTitle || `${doc.title} Flashcards`;

    db.prepare(`
      INSERT INTO flashcard_decks (id, user_id, document_id, title, subject)
      VALUES (?, ?, ?, ?, ?)
    `).run(deckId, userId, documentId, deckTitle, doc.subject || 'General');

    const insertCard = db.prepare(`
      INSERT INTO flashcards (
        id, deck_id, front, back, source_ref, difficulty, interval_days, repetition_count, ease_factor, due_date, mastery_status
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 2.5, CURRENT_TIMESTAMP, 'new')
    `);

    for (let i = 0; i < result.cards.length; i++) {
      const card = result.cards[i];
      const cardId = `crd_${deckId}_${i}`;
      insertCard.run(
        cardId,
        deckId,
        card.front,
        card.back,
        card.sourceRef || 'General',
        card.difficulty || 'medium'
      );
    }

    res.status(201).json({
      deckId,
      title: deckTitle,
      cardCount: result.cards.length,
      isAi: result.isAi,
      warning: result.warning
    });
  } catch (err: any) {
    console.error('Flashcard error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate flashcards' });
  }
});

// List decks with spaced repetition statistics
router.get('/decks', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';

    const decks = db.prepare(`
      SELECT d.*, doc.title as document_title,
             COUNT(c.id) as total_cards,
             SUM(CASE WHEN c.due_date <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as due_today,
             SUM(CASE WHEN c.mastery_status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
             SUM(CASE WHEN c.mastery_status = 'learning' THEN 1 ELSE 0 END) as learning_count,
             SUM(CASE WHEN c.mastery_status = 'new' THEN 1 ELSE 0 END) as new_count
      FROM flashcard_decks d
      LEFT JOIN documents doc ON d.document_id = doc.id
      LEFT JOIN flashcards c ON c.deck_id = d.id
      WHERE d.user_id = ?
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `).all(userId);

    res.json({ decks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get deck and cards
router.get('/decks/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const deckId = req.params.id;

    const deck: any = db.prepare(`
      SELECT d.*, doc.title as document_title
      FROM flashcard_decks d
      LEFT JOIN documents doc ON d.document_id = doc.id
      WHERE d.id = ? AND d.user_id = ?
    `).get(deckId, userId);

    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const cards = db.prepare(`
      SELECT * FROM flashcards WHERE deck_id = ?
      ORDER BY due_date ASC, id ASC
    `).all(deckId);

    res.json({ deck, cards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add manual card to deck
router.post('/decks/:id/cards', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const deckId = req.params.id;
    const { front, back, sourceRef = 'Custom', difficulty = 'medium' } = req.body;

    const deck: any = db.prepare('SELECT id FROM flashcard_decks WHERE id = ? AND user_id = ?').get(deckId, userId);
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const cardId = 'crd_m_' + Date.now();
    db.prepare(`
      INSERT INTO flashcards (
        id, deck_id, front, back, source_ref, difficulty, interval_days, repetition_count, ease_factor, due_date, mastery_status
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 2.5, CURRENT_TIMESTAMP, 'new')
    `).run(cardId, deckId, front, back, sourceRef, difficulty);

    res.status(201).json({ success: true, cardId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete deck
router.delete('/decks/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    db.prepare('DELETE FROM flashcard_decks WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Deck deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record review with Spaced Repetition (SM-2 Algorithm)
router.post('/:id/review', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const cardId = req.params.id;
    const { rating } = req.body; // rating: 1 (Need Practice / Again) to 5 (Mastered / Easy)

    const card: any = db.prepare(`
      SELECT c.*, d.user_id FROM flashcards c
      JOIN flashcard_decks d ON c.deck_id = d.id
      WHERE c.id = ? AND d.user_id = ?
    `).get(cardId, userId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const numRating = Number(rating) || 3;
    let interval = card.interval_days || 1;
    let repetitions = card.repetition_count || 0;
    let easeFactor = card.ease_factor || 2.5;
    let masteryStatus = card.mastery_status || 'learning';

    if (numRating < 3) {
      // Failed / Need Practice: Reset interval
      repetitions = 0;
      interval = 1;
      masteryStatus = 'learning';
    } else {
      // Successful recall
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;

      // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      const diff = 5 - numRating;
      easeFactor = Math.max(1.3, easeFactor + (0.1 - diff * (0.08 + diff * 0.02)));

      if (interval >= 14 || repetitions >= 4) {
        masteryStatus = 'mastered';
      } else {
        masteryStatus = 'learning';
      }
    }

    // Compute next due date
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + interval);
    const dueDateStr = nextDue.toISOString().replace('T', ' ').slice(0, 19);

    db.prepare(`
      UPDATE flashcards
      SET interval_days = ?,
          repetition_count = ?,
          ease_factor = ?,
          due_date = ?,
          last_reviewed = CURRENT_TIMESTAMP,
          review_count = review_count + 1,
          mastery_status = ?
      WHERE id = ?
    `).run(interval, repetitions, easeFactor, dueDateStr, masteryStatus, cardId);

    // Record review event
    const revId = 'rev_' + Date.now();
    db.prepare(`
      INSERT INTO flashcard_reviews (id, card_id, user_id, rating)
      VALUES (?, ?, ?, ?)
    `).run(revId, cardId, userId, numRating);

    res.json({
      success: true,
      cardId,
      intervalDays: interval,
      masteryStatus,
      nextDueDate: dueDateStr
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateQuizQuestions } from '../services/aiService.js';

const router = Router();

// Generate a new quiz
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const {
      documentId,
      questionCount = 5,
      difficulty = 'medium',
      questionTypes = ['mcq', 'true_false'],
      mode = 'practice',
      timeLimitMins = 10
    } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }

    const doc: any = db.prepare('SELECT title FROM documents WHERE id = ? AND user_id = ?').get(documentId, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const chunks: any[] = db.prepare(`
      SELECT content, page_number FROM document_chunks
      WHERE document_id = ?
      ORDER BY page_number ASC, chunk_index ASC
    `).all(documentId);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No content available for this document.' });
    }

    const combinedText = chunks.map(c => `[Page ${c.page_number}] ${c.content}`).join('\n\n');

    const generated = await generateQuizQuestions({
      documentTitle: doc.title,
      documentText: combinedText,
      questionCount: Number(questionCount),
      difficulty,
      questionTypes,
      userId
    });

    if (!generated.questions || generated.questions.length === 0) {
      return res.status(500).json({ error: 'Could not generate questions for this document.' });
    }

    const quizId = 'qz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const title = `${doc.title} - ${difficulty.toUpperCase()} Quiz`;

    db.prepare(`
      INSERT INTO quizzes (
        id, user_id, document_id, title, difficulty, question_count, mode, time_limit_mins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      quizId,
      userId,
      documentId,
      title,
      difficulty,
      generated.questions.length,
      mode,
      timeLimitMins
    );

    const insertQ = db.prepare(`
      INSERT INTO quiz_questions (
        id, quiz_id, question_text, question_type, options, correct_answer, explanation, source_page, topic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < generated.questions.length; i++) {
      const q = generated.questions[i];
      const qId = `qq_${quizId}_${i}`;
      insertQ.run(
        qId,
        quizId,
        q.questionText,
        q.questionType || 'mcq',
        q.options ? JSON.stringify(q.options) : null,
        typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer),
        q.explanation || 'No explanation provided.',
        q.sourcePage || 1,
        q.topic || doc.title
      );
    }

    res.status(201).json({
      quizId,
      title,
      questionCount: generated.questions.length,
      difficulty,
      mode,
      isAi: generated.isAi,
      warning: generated.warning
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz' });
  }
});

// List quizzes
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const quizzes = db.prepare(`
      SELECT q.*, d.title as document_title,
             (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) as attempts_count,
             (SELECT MAX(accuracy_pct) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) as best_score
      FROM quizzes q
      LEFT JOIN documents d ON q.document_id = d.id
      WHERE q.user_id = ?
      ORDER BY q.created_at DESC
    `).all(userId);

    res.json({ quizzes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get quiz and questions
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const quizId = req.params.id;

    const quiz: any = db.prepare(`
      SELECT q.*, d.title as document_title
      FROM quizzes q
      LEFT JOIN documents d ON q.document_id = d.id
      WHERE q.id = ? AND q.user_id = ?
    `).get(quizId, userId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions: any[] = db.prepare(`
      SELECT id, question_text, question_type, options, source_page, topic
      FROM quiz_questions
      WHERE quiz_id = ?
    `).all(quizId);

    res.json({
      quiz,
      questions: questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : []
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit quiz answers & grade
router.post('/:id/submit', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const quizId = req.params.id;
    const { answers, timeSpentSecs = 0 } = req.body; // { [questionId]: userAnswer }

    const quiz: any = db.prepare('SELECT id, question_count FROM quizzes WHERE id = ? AND user_id = ?').get(quizId, userId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions: any[] = db.prepare(`
      SELECT id, question_text, question_type, correct_answer, explanation, source_page, topic
      FROM quiz_questions
      WHERE quiz_id = ?
    `).all(quizId);

    let correctCount = 0;
    const gradedResults: any[] = [];
    const attemptId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Evaluate each question
    for (const q of questions) {
      const userAns = answers ? answers[q.id] : undefined;
      let isCorrect = false;

      if (userAns !== undefined && userAns !== null) {
        const cleanUser = String(userAns).trim().toLowerCase();
        let cleanCorrect = String(q.correct_answer).trim().toLowerCase();
        try {
          // If stored as JSON string
          const parsed = JSON.parse(q.correct_answer);
          if (Array.isArray(parsed)) {
            cleanCorrect = parsed.join(',').toLowerCase();
          }
        } catch {}

        if (cleanUser === cleanCorrect) {
          isCorrect = true;
          correctCount++;
        }
      }

      gradedResults.push({
        questionId: q.id,
        questionText: q.question_text,
        userAnswer: userAns || '(Skipped)',
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
        sourcePage: q.source_page,
        topic: q.topic
      });
    }

    const totalQuestions = questions.length;
    const accuracyPct = Math.round((correctCount / totalQuestions) * 100);

    // Save attempt record
    db.prepare(`
      INSERT INTO quiz_attempts (
        id, quiz_id, user_id, score, total_questions, accuracy_pct, time_spent_secs
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(attemptId, quizId, userId, correctCount, totalQuestions, accuracyPct, timeSpentSecs);

    // Save answer details
    const insertAns = db.prepare(`
      INSERT INTO quiz_answers (id, attempt_id, question_id, user_answer, is_correct, feedback)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const r of gradedResults) {
      const ansId = 'ans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      insertAns.run(ansId, attemptId, r.questionId, String(r.userAnswer), r.isCorrect ? 1 : 0, r.explanation);
    }

    // Identify weak topics from mistakes in this attempt
    const weakTopics = Array.from(new Set(gradedResults.filter(r => !r.isCorrect).map(r => r.topic || 'General Concepts')));

    res.json({
      attemptId,
      score: correctCount,
      totalQuestions,
      accuracyPct,
      timeSpentSecs,
      weakTopics,
      results: gradedResults
    });
  } catch (err: any) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get attempt details
router.get('/attempts/:attemptId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const attempt: any = db.prepare(`
      SELECT qa.*, q.title as quiz_title, q.difficulty, q.document_id
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = ? AND qa.user_id = ?
    `).get(req.params.attemptId, userId);

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const answers = db.prepare(`
      SELECT qa.user_answer, qa.is_correct, qa.feedback,
             qq.question_text, qq.correct_answer, qq.explanation, qq.source_page, qq.topic
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      WHERE qa.attempt_id = ?
    `).all(req.params.attemptId);

    const weakTopics = Array.from(new Set(answers.filter((a: any) => !a.is_correct).map((a: any) => a.topic)));

    res.json({
      attempt,
      answers,
      weakTopics
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// "Practice My Mistakes": builds targeted practice quiz from questions user previously answered incorrectly!
router.post('/practice-mistakes', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';

    // Find all distinct questions where the user made mistakes
    const wrongQuestions: any[] = db.prepare(`
      SELECT DISTINCT qq.id, qq.question_text, qq.question_type, qq.options, qq.correct_answer,
                      qq.explanation, qq.source_page, qq.topic, q.document_id
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      JOIN quiz_attempts att ON qa.attempt_id = att.id
      JOIN quizzes q ON att.quiz_id = q.id
      WHERE att.user_id = ? AND qa.is_correct = 0
      ORDER BY qa.id DESC
      LIMIT 10
    `).all(userId);

    if (wrongQuestions.length === 0) {
      return res.status(400).json({ error: 'No previous mistakes recorded yet! Take a quiz first to identify topics that need practice.' });
    }

    const quizId = 'qz_mistakes_' + Date.now();
    const title = 'Practice My Mistakes — Focused Revision';

    db.prepare(`
      INSERT INTO quizzes (
        id, user_id, document_id, title, difficulty, question_count, mode, time_limit_mins
      ) VALUES (?, ?, ?, ?, 'mixed', ?, 'practice', 15)
    `).run(quizId, userId, wrongQuestions[0].document_id || null, title, wrongQuestions.length);

    const insertQ = db.prepare(`
      INSERT INTO quiz_questions (
        id, quiz_id, question_text, question_type, options, correct_answer, explanation, source_page, topic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < wrongQuestions.length; i++) {
      const q = wrongQuestions[i];
      const qId = `qq_${quizId}_${i}`;
      insertQ.run(qId, quizId, q.question_text, q.question_type, q.options, q.correct_answer, q.explanation, q.source_page, q.topic);
    }

    res.status(201).json({
      quizId,
      title,
      questionCount: wrongQuestions.length,
      message: `Created practice session targeting ${wrongQuestions.length} previously missed questions.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';

    // Total documents
    const docCount: any = db.prepare('SELECT COUNT(*) as count FROM documents WHERE user_id = ?').get(userId);
    // Total notes
    const noteCount: any = db.prepare('SELECT COUNT(*) as count FROM notes WHERE user_id = ?').get(userId);
    // Total quizzes attempted
    const attemptCount: any = db.prepare('SELECT COUNT(*) as count, AVG(accuracy_pct) as avg_score FROM quiz_attempts WHERE user_id = ?').get(userId);

    // Flashcard stats
    const cardStats: any = db.prepare(`
      SELECT COUNT(c.id) as total_cards,
             SUM(CASE WHEN c.due_date <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END) as due_today,
             SUM(CASE WHEN c.mastery_status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
             SUM(CASE WHEN c.mastery_status = 'learning' THEN 1 ELSE 0 END) as learning_count
      FROM flashcards c
      JOIN flashcard_decks d ON c.deck_id = d.id
      WHERE d.user_id = ?
    `).get(userId);

    // Recent documents (up to 4)
    const recentDocs = db.prepare(`
      SELECT id, title, file_type, page_count, subject, created_at
      FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 4
    `).all(userId);

    // Recent notes (up to 4)
    const recentNotes = db.prepare(`
      SELECT n.id, n.title, n.note_type, n.updated_at, d.title as document_title
      FROM notes n
      LEFT JOIN documents d ON n.document_id = d.id
      WHERE n.user_id = ? ORDER BY n.updated_at DESC LIMIT 4
    `).all(userId);

    // Recent quiz attempts (up to 4)
    const recentAttempts = db.prepare(`
      SELECT qa.id, qa.score, qa.total_questions, qa.accuracy_pct, qa.completed_at,
             q.title as quiz_title, q.difficulty
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 4
    `).all(userId);

    // Weak topics (computed from actual failed questions in quiz_answers)
    const weakTopics = db.prepare(`
      SELECT qq.topic, COUNT(*) as mistakes_count
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      JOIN quiz_attempts att ON qa.attempt_id = att.id
      WHERE att.user_id = ? AND qa.is_correct = 0 AND qq.topic IS NOT NULL
      GROUP BY qq.topic
      ORDER BY mistakes_count DESC
      LIMIT 5
    `).all(userId);

    // Topic-wise accuracy breakdown
    const topicAccuracy = db.prepare(`
      SELECT qq.topic,
             COUNT(*) as total_answered,
             SUM(qa.is_correct) as correct_count,
             ROUND(AVG(qa.is_correct) * 100, 1) as accuracy_pct
      FROM quiz_answers qa
      JOIN quiz_questions qq ON qa.question_id = qq.id
      JOIN quiz_attempts att ON qa.attempt_id = att.id
      WHERE att.user_id = ? AND qq.topic IS NOT NULL
      GROUP BY qq.topic
      ORDER BY total_answered DESC
      LIMIT 6
    `).all(userId);

    // Upcoming study tasks (next 3 tasks)
    const upcomingTasks = db.prepare(`
      SELECT t.*, p.subject
      FROM study_tasks t
      LEFT JOIN study_plans p ON t.plan_id = p.id
      WHERE t.user_id = ? AND t.is_completed = 0
      ORDER BY t.due_date ASC
      LIMIT 3
    `).all(userId);

    // Calculate real study streak
    // Distinct days of user activity across documents, notes, quizzes, or flashcard reviews
    const activityDays: any[] = db.prepare(`
      SELECT DISTINCT substr(created_at, 1, 10) as day FROM documents WHERE user_id = ?
      UNION
      SELECT DISTINCT substr(created_at, 1, 10) as day FROM notes WHERE user_id = ?
      UNION
      SELECT DISTINCT substr(completed_at, 1, 10) as day FROM quiz_attempts WHERE user_id = ?
      ORDER BY day DESC
    `).all(userId, userId, userId);

    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const daySet = new Set(activityDays.map(a => a.day));

    // Check if today or yesterday is present
    let checkDate = new Date();
    if (!daySet.has(todayStr)) {
      // Check yesterday to keep streak alive
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (daySet.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    res.json({
      metrics: {
        totalDocuments: docCount.count || 0,
        totalNotes: noteCount.count || 0,
        totalQuizzesAttempted: attemptCount.count || 0,
        averageQuizScore: attemptCount.avg_score ? Math.round(attemptCount.avg_score) : 0,
        studyStreakDays: Math.max(streak, (docCount.count > 0 ? 1 : 0)),
        totalCards: cardStats.total_cards || 0,
        cardsDueToday: cardStats.due_today || 0,
        cardsMastered: cardStats.mastered_count || 0,
        cardsLearning: cardStats.learning_count || 0
      },
      recentDocs,
      recentNotes,
      recentAttempts,
      weakTopics,
      topicAccuracy,
      upcomingTasks
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

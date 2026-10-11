import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { generateStudyPlan } from '../services/aiService.js';

const router = Router();

// Generate study plan with AI
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const {
      subject,
      examDate,
      dailyHours = 2.0,
      preferredDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      confidenceLevel = 'medium',
      syllabusTopics = []
    } = req.body;

    if (!subject || !examDate) {
      return res.status(400).json({ error: 'Subject and Exam Date are required.' });
    }

    const topics = Array.isArray(syllabusTopics) && syllabusTopics.length > 0
      ? syllabusTopics
      : [`Foundations of ${subject}`, `Core Principles & Applications`, `Exam Review & Mock Questions`];

    const planId = 'pln_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    db.prepare(`
      INSERT INTO study_plans (
        id, user_id, subject, exam_date, daily_hours, preferred_days, confidence_level, syllabus_topics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      planId,
      userId,
      subject,
      examDate,
      Number(dailyHours),
      JSON.stringify(preferredDays),
      confidenceLevel,
      JSON.stringify(topics)
    );

    const generated = await generateStudyPlan(subject, examDate, Number(dailyHours), confidenceLevel, topics, userId);

    const insertTask = db.prepare(`
      INSERT INTO study_tasks (
        id, plan_id, user_id, title, topic, task_type, due_date, duration_mins, is_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    for (let i = 0; i < generated.tasks.length; i++) {
      const t = generated.tasks[i];
      const taskId = `tsk_${planId}_${i}`;
      insertTask.run(
        taskId,
        planId,
        userId,
        t.title,
        t.topic || subject,
        t.taskType || 'study',
        t.dueDate || new Date().toISOString().split('T')[0],
        t.durationMins || 45
      );
    }

    res.status(201).json({
      planId,
      subject,
      examDate,
      taskCount: generated.tasks.length,
      isAi: generated.isAi,
      warning: generated.warning
    });
  } catch (err: any) {
    console.error('Planner error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate study plan' });
  }
});

// Get all study tasks for user
router.get('/tasks', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const tasks = db.prepare(`
      SELECT t.*, p.subject, p.exam_date
      FROM study_tasks t
      LEFT JOIN study_plans p ON t.plan_id = p.id
      WHERE t.user_id = ?
      ORDER BY t.due_date ASC, t.is_completed ASC
    `).all(userId);

    const plans = db.prepare(`
      SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId);

    res.json({ tasks, plans });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle task completion
router.put('/tasks/:id/toggle', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const taskId = req.params.id;

    const task: any = db.prepare('SELECT id, is_completed FROM study_tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const nextState = task.is_completed ? 0 : 1;
    const completedAt = nextState ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE study_tasks
      SET is_completed = ?, completed_at = ?
      WHERE id = ?
    `).run(nextState, completedAt, taskId);

    res.json({ success: true, isCompleted: nextState === 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule task
router.put('/tasks/:id/reschedule', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const taskId = req.params.id;
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ error: 'dueDate is required' });
    }

    db.prepare('UPDATE study_tasks SET due_date = ? WHERE id = ? AND user_id = ?').run(dueDate, taskId, userId);
    res.json({ success: true, message: 'Task rescheduled successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create manual task
router.post('/tasks', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    const { title, topic, taskType = 'study', dueDate, durationMins = 30 } = req.body;

    const taskId = 'tsk_m_' + Date.now();
    db.prepare(`
      INSERT INTO study_tasks (
        id, plan_id, user_id, title, topic, task_type, due_date, duration_mins, is_completed
      ) VALUES (?, 'custom', ?, ?, ?, ?, ?, ?, 0)
    `).run(taskId, userId, title, topic || 'General', taskType, dueDate || new Date().toISOString().split('T')[0], durationMins);

    res.status(201).json({ success: true, taskId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/tasks/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'user_demo_studymate_001';
    db.prepare('DELETE FROM study_tasks WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

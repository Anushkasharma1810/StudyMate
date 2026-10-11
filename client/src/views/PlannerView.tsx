import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { StudyPlan, StudyTask } from '../types.js';

export const PlannerView: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [subject, setSubject] = useState('Operating Systems');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(2.0);
  const [confidence, setConfidence] = useState('medium');
  const [syllabusInput, setSyllabusInput] = useState('Processes & Threads, CPU Scheduling, Synchronization & Deadlocks, Virtual Memory & Paging, File Systems');
  const [generating, setGenerating] = useState(false);

  // Manual task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskType, setTaskType] = useState<'study' | 'quiz' | 'revision'>('study');
  const [taskDueDate, setTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taskDuration, setTaskDuration] = useState(45);

  useEffect(() => {
    loadPlanner();
  }, []);

  const loadPlanner = async () => {
    setLoading(true);
    try {
      const res = await api.getPlannerTasks();
      setTasks(res.tasks || []);
      setPlans(res.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!subject.trim() || !examDate) {
      alert('Please enter a subject and target exam date.');
      return;
    }
    setGenerating(true);

    const topics = syllabusInput.split(/[,;\n]/).map(t => t.trim()).filter(Boolean);

    try {
      await api.generatePlan({
        subject,
        examDate,
        dailyHours,
        confidenceLevel: confidence,
        syllabusTopics: topics
      });
      await loadPlanner();
    } catch (err: any) {
      alert(err.message || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await api.toggleTask(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: t.is_completed ? 0 : 1 } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReschedule = async (taskId: string, newDate: string) => {
    try {
      await api.rescheduleTask(taskId, newDate);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, due_date: newDate } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      await api.createTask({
        title: taskTitle,
        topic: taskTopic || subject,
        taskType,
        dueDate: taskDueDate,
        durationMins: taskDuration
      });
      setShowAddModal(false);
      setTaskTitle('');
      setTaskTopic('');
      loadPlanner();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const completedCount = tasks.filter(t => t.is_completed === 1).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Top Title & Progress Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            Personalized Study Planner
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            AI-scheduled daily milestones, revision intervals, and practice sessions leading up to your exam.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-secondary btn-sm">
          <Plus size={15} />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Progress Bar (if tasks exist) */}
      {tasks.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              Plan Progress: {completedCount} of {tasks.length} Tasks Completed
            </span>
            <span className="badge badge-primary">{progressPct}% Complete</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Generator Wizard Card */}
      <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>
          Generate an Adaptive Exam Schedule
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Subject / Course Name
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="input"
              placeholder="e.g. Data Structures"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Target Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Available Hours Per Day
            </label>
            <select
              value={dailyHours}
              onChange={e => setDailyHours(Number(e.target.value))}
              className="select"
            >
              <option value={1}>1.0 Hour / Day</option>
              <option value={2}>2.0 Hours / Day</option>
              <option value={3}>3.0 Hours / Day</option>
              <option value={4}>4+ Hours / Day</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Current Confidence Level
            </label>
            <select
              value={confidence}
              onChange={e => setConfidence(e.target.value)}
              className="select"
            >
              <option value="low">Low (Needs Foundations)</option>
              <option value="medium">Medium (Moderate Practice)</option>
              <option value="high">High (Fast Revision Only)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
            Syllabus Topics (separated by commas or new lines)
          </label>
          <textarea
            value={syllabusInput}
            onChange={e => setSyllabusInput(e.target.value)}
            className="textarea"
            style={{ minHeight: '70px' }}
            placeholder="Topic 1, Topic 2, Topic 3..."
          />
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          {generating ? (
            <>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <span>Building Day-by-Day Schedule...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate Personalized Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Day-by-day Tasks List */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
          Your Study Tasks & Milestones ({tasks.length})
        </h3>

        {tasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-soft)' }}>
            <CalendarDays size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem' }}>No tasks scheduled. Use the planner wizard above to create your schedule.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(t => {
              const isDone = t.is_completed === 1;
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: isDone ? 'var(--bg-subtle)' : 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    opacity: isDone ? 0.75 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleTask(t.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                        <span>Topic: {t.topic}</span>
                        <span>•</span>
                        <span>Est: {t.duration_mins} mins</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${t.task_type === 'quiz' ? 'badge-warning' : t.task_type === 'revision' ? 'badge-primary' : 'badge-subtle'}`}>
                      {t.task_type.toUpperCase()}
                    </span>

                    {/* Reschedule inline date picker */}
                    <input
                      type="date"
                      value={t.due_date}
                      onChange={e => handleReschedule(t.id, e.target.value)}
                      className="input"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', width: '130px' }}
                      title="Reschedule task due date"
                    />

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-rose)', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
              Add Study Task
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Task Title
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                className="input"
                placeholder="e.g. Read Chapter 3 and create summary notes"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Topic
                </label>
                <input
                  type="text"
                  value={taskTopic}
                  onChange={e => setTaskTopic(e.target.value)}
                  className="input"
                  placeholder="e.g. Paging"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Task Type
                </label>
                <select value={taskType} onChange={e => setTaskType(e.target.value as any)} className="select">
                  <option value="study">Study</option>
                  <option value="revision">Revision</option>
                  <option value="quiz">Practice Quiz</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  value={taskDuration}
                  onChange={e => setTaskDuration(Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateTask} className="btn btn-primary">
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

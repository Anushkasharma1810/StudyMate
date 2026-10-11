import React, { useEffect, useState } from 'react';
import {
  FileText,
  UploadCloud,
  GraduationCap,
  Flame,
  Layers,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { DashboardMetrics, DocumentItem, NoteItem, QuizAttempt, StudyTask } from '../types.js';

export const DashboardView: React.FC = () => {
  const { user, setActiveTab, setSelectedDocumentId } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteItem[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = () => {
    setLoading(true);
    api.getDashboardAnalytics()
      .then(res => {
        setMetrics(res.metrics);
        setRecentDocs(res.recentDocs || []);
        setRecentNotes(res.recentNotes || []);
        setRecentAttempts(res.recentAttempts || []);
        setWeakTopics(res.weakTopics || []);
        setUpcomingTasks(res.upcomingTasks || []);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handlePracticeMistakes = async () => {
    try {
      const res = await api.practiceMistakes();
      setActiveTab('quiz');
    } catch (err: any) {
      alert(err.message || 'No recorded mistakes yet. Take a quiz first!');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await api.toggleTask(taskId);
      loadDashboard();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading your study progress...</p>
      </div>
    );
  }

  const hasAnyData = (metrics?.totalDocuments || 0) > 0 || (metrics?.totalQuizzesAttempted || 0) > 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 28px 60px' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '26px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Welcome back, {user?.name || 'Scholar'}! 👋
            </h2>
            <div
              className="badge"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#D97706',
                padding: '4px 10px',
                fontSize: '0.8rem'
              }}
            >
              <Flame size={14} />
              <span>{metrics?.studyStreakDays || 1} Day Streak</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Keep up your momentum! You have <strong style={{ color: 'var(--text-main)' }}>{metrics?.cardsDueToday || 0} flashcards</strong> due for spaced review today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('upload')}
            className="btn btn-primary"
          >
            <UploadCloud size={16} />
            <span>Upload New Material</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className="btn btn-secondary"
          >
            <Layers size={16} />
            <span>Review Flashcards</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-soft)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>DOCUMENTS</span>
            <BookOpen size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics?.totalDocuments || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Processed & indexed
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-soft)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>NOTES CREATED</span>
            <FileText size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics?.totalNotes || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Saved study summaries
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-soft)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>QUIZZES TAKEN</span>
            <GraduationCap size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics?.totalQuizzesAttempted || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tests completed
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-soft)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>AVERAGE SCORE</span>
            <Sparkles size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics?.averageQuizScore || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Overall test accuracy
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-soft)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>CARDS MASTERED</span>
            <Layers size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {metrics?.cardsMastered || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Of {metrics?.totalCards || 0} active cards
          </div>
        </div>
      </div>

      {/* Weak Topics Callout (if any mistakes recorded) */}
      {weakTopics.length > 0 && (
        <div
          className="card"
          style={{
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.04)',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '4px' }}>
                Target Your Weak Topics
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Based on your actual quiz history, you need revision in:{' '}
                {weakTopics.map(w => (
                  <strong key={w.topic} style={{ color: 'var(--text-main)', marginRight: '6px' }}>
                    {w.topic} ({w.mistakes_count} misses)
                  </strong>
                ))}
              </p>
            </div>
          </div>

          <button
            onClick={handlePracticeMistakes}
            className="btn btn-sm"
            style={{ background: 'var(--accent-rose)', color: '#FFFFFF', border: 'none' }}
          >
            <Sparkles size={14} />
            <span>Practice My Mistakes</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left (Recent Docs & Notes) / Right (Upcoming Tasks & Quizzes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Documents */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Documents</h3>
              <button
                onClick={() => setActiveTab('library')}
                className="btn btn-ghost btn-sm"
              >
                <span>View Library</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-soft)' }}>
                <UploadCloud size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>No study materials uploaded yet.</p>
                <button onClick={() => setActiveTab('upload')} className="btn btn-secondary btn-sm">
                  Upload your first PDF
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentDocs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', display: 'flex', gap: '10px' }}>
                        <span>{doc.file_type}</span>
                        <span>•</span>
                        <span>{doc.page_count} pages</span>
                        <span>•</span>
                        <span>{doc.subject}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setSelectedDocumentId(doc.id);
                          setActiveTab('notes');
                        }}
                        className="btn btn-secondary btn-sm"
                        title="Generate Notes"
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDocumentId(doc.id);
                          setActiveTab('chat');
                        }}
                        className="btn btn-primary btn-sm"
                        title="Ask Questions"
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notes */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Saved Study Notes</h3>
              <button
                onClick={() => setActiveTab('notes')}
                className="btn btn-ghost btn-sm"
              >
                <span>All Notes</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-soft)' }}>
                <p style={{ fontSize: '0.88rem' }}>No generated notes yet. Select a document to create your first notes set.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentNotes.map(n => (
                  <div
                    key={n.id}
                    onClick={() => setActiveTab('notes')}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                        {n.document_title || 'General'}
                      </div>
                    </div>
                    <span className="badge badge-primary">{n.note_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upcoming Revision Tasks */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Study Tasks</h3>
              <button
                onClick={() => setActiveTab('planner')}
                className="btn btn-ghost btn-sm"
              >
                <span>Open Planner</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-soft)' }}>
                <CalendarDays size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.88rem', marginBottom: '8px' }}>No active study schedule.</p>
                <button onClick={() => setActiveTab('planner')} className="btn btn-secondary btn-sm">
                  Generate Exam Plan
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingTasks.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={t.is_completed === 1}
                        onChange={() => handleToggleTask(t.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', textDecoration: t.is_completed ? 'line-through' : 'none' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                          Due: {t.due_date} • {t.duration_mins} mins
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-subtle">{t.task_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Scores */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Quiz Attempts</h3>
              <button
                onClick={() => setActiveTab('quiz')}
                className="btn btn-ghost btn-sm"
              >
                <span>Take Quiz</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {recentAttempts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-soft)' }}>
                <p style={{ fontSize: '0.88rem' }}>No quizzes attempted yet. Generate a practice quiz to evaluate your retention!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentAttempts.map(att => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {att.quiz_title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>
                        Score: {att.score}/{att.total_questions} questions
                      </div>
                    </div>
                    <span
                      className={`badge ${att.accuracy_pct >= 80 ? 'badge-success' : att.accuracy_pct >= 50 ? 'badge-warning' : 'badge-danger'}`}
                    >
                      {att.accuracy_pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

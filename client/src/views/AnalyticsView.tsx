import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  BookOpen,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DashboardMetrics } from '../types.js';

export const AnalyticsView: React.FC = () => {
  const { setActiveTab } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topicAccuracy, setTopicAccuracy] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardAnalytics().then(res => {
      setMetrics(res.metrics);
      setTopicAccuracy(res.topicAccuracy || []);
      setWeakTopics(res.weakTopics || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          Academic Progress & Performance Analytics
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Metrics computed from your actual test submissions, flashcard reviews, and study activity.
        </p>
      </div>

      {/* Main Metrics Card */}
      <div
        className="card"
        style={{
          padding: '28px',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', marginBottom: '8px' }}>
            <Flame size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>STUDY STREAK</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {metrics?.studyStreakDays || 1} Days
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Consecutive days active</p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', marginBottom: '8px' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>AVERAGE ACCURACY</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {metrics?.averageQuizScore || 0}%
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Across all practice tests</p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
            <Layers size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>CARDS MASTERED</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {metrics?.cardsMastered || 0}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Of {metrics?.totalCards || 0} spaced flashcards</p>
        </div>
      </div>

      {/* Two Columns: Topic Accuracy Breakdown & Weak Concepts Alert */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Topic-Wise Accuracy */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>
            Topic-Wise Test Accuracy
          </h3>

          {topicAccuracy.length === 0 ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)', padding: '20px 0' }}>
              Take your first practice quiz to see your topic-level accuracy breakdown.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topicAccuracy.map((t, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{t.topic}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{t.accuracy_pct}% ({t.correct_count}/{t.total_answered})</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${t.accuracy_pct}%`,
                        height: '100%',
                        background: t.accuracy_pct >= 80 ? 'var(--accent-green)' : t.accuracy_pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics Analysis */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span>Targeted Weak Areas</span>
          </h3>

          {weakTopics.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--text-soft)' }}>
              <p style={{ fontSize: '0.88rem' }}>
                No weak concepts detected! Either you have not taken any quizzes yet or you achieved 100% accuracy.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weakTopics.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {w.topic}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)' }}>
                      {w.mistakes_count} Recorded Mistakes
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="btn btn-sm"
                    style={{ background: 'var(--accent-rose)', color: '#FFFFFF', border: 'none' }}
                  >
                    Revise
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

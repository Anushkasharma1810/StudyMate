import React from 'react';
import {
  BookOpen,
  ArrowRight,
  UploadCloud,
  FileText,
  MessageSquareText,
  GraduationCap,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  BrainCircuit,
  Zap,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LandingView: React.FC = () => {
  const { setActiveTab, demoLogin } = useAuth();

  const features = [
    {
      icon: FileText,
      title: 'Structured AI Notes',
      desc: 'Convert heavy textbooks and slides into exam-oriented summaries, definition glossaries, and formula cheat-sheets in English, Hindi, or Hinglish.'
    },
    {
      icon: MessageSquareText,
      title: 'Ask Your PDF (RAG)',
      desc: 'Chat directly with your documents. Get precise answers with bracketed page references like [Page 4] so you can verify facts instantly.'
    },
    {
      icon: GraduationCap,
      title: 'AI Quizzes & Timed Tests',
      desc: 'Generate MCQs, True/False, and multi-select questions. Track real scores and use "Practice My Mistakes" to target concepts you missed.'
    },
    {
      icon: Layers,
      title: 'Spaced Repetition Flashcards',
      desc: 'Active recall flashcards scheduled via the SuperMemo SM-2 algorithm to cement concepts into your long-term memory.'
    },
    {
      icon: CalendarDays,
      title: 'Personalized Study Planner',
      desc: 'Input your exam date and available hours to generate realistic day-by-day revision milestones and topic deadlines.'
    },
    {
      icon: BrainCircuit,
      title: 'Visual Mind Maps & Explainer',
      desc: 'Explore interactive concept hierarchies and get multi-level explanations with intuitive analogies and real-world cases.'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Upload Material',
      desc: 'Drop in any PDF, DOCX, or TXT file. StudyMate extracts text page-by-page and segments chapters automatically.'
    },
    {
      num: '02',
      title: 'Synthesize & Question',
      desc: 'Generate customized notes, mind maps, and ask complex conceptual questions grounded in your document.'
    },
    {
      num: '03',
      title: 'Practice & Retain',
      desc: 'Take timed practice quizzes, review active recall flashcards, and track your study streak to exam day.'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px 80px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '40px 0 50px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}
        >
          <Sparkles size={16} />
          <span>Your Complete Academic AI Study Partner</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            color: 'var(--text-main)',
            maxWidth: '900px',
            margin: '0 auto 20px'
          }}
        >
          Study Smarter. Learn Faster.{' '}
          <span style={{ color: 'var(--primary)', display: 'inline-block' }}>
            Remember More.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}
        >
          StudyMate transforms dense textbooks, PDFs, and lecture notes into structured study sheets, document-grounded AI tutors, adaptive practice quizzes, and spaced-repetition flashcards.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="btn btn-primary btn-lg"
            style={{ boxShadow: '0 8px 24px var(--primary-ring)' }}
          >
            <span>Start Studying Free</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className="btn btn-secondary btn-lg"
          >
            <UploadCloud size={18} />
            <span>Upload Document</span>
          </button>

          <button
            onClick={demoLogin}
            className="btn btn-ghost btn-lg"
            style={{ textDecoration: 'underline' }}
          >
            <span>Explore Demo Data</span>
          </button>
        </div>
      </section>

      {/* Product Preview Card */}
      <div
        className="card"
        style={{
          margin: '20px auto 70px',
          padding: '28px',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '10px' }}>
              StudyMate Workspace — Quantum Mechanics & Atomic Structure
            </span>
          </div>
          <div className="badge badge-primary">Interactive Preview</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ background: 'var(--bg-card)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <FileText size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Generated Notes</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
              Includes learning objectives, key definitions, formulas, and 5-minute revision summaries.
            </p>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              # Heisenberg Uncertainty Principle<br />
              Δx · Δp ≥ ℏ / 2<br />
              <span style={{ color: 'var(--primary)' }}>[Source: Page 4, Section 2.1]</span>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <MessageSquareText size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Document Grounded Q&A</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'var(--primary-light)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', alignSelf: 'flex-end', color: 'var(--primary)', fontWeight: 500 }}>
                Can you explain wave-particle duality simply?
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
                Matter exhibits properties of both waves and particles [Page 2]. Think of light like ripples in water that can also hit like tiny billiard balls.
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-card)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <GraduationCap size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Adaptive Quiz & Scores</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest Attempt</span>
              <span className="badge badge-success">85% Accuracy</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: '85%', height: '100%', background: 'var(--accent-green)' }} />
            </div>
            <button
              onClick={() => setActiveTab('quiz')}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              Practice Weak Topics
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step Workflow Section */}
      <section style={{ margin: '70px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '14px' }}>
          How StudyMate Works
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 40px' }}>
          From raw lecture notes to exam-ready confidence in three effortless steps.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {steps.map((st, i) => (
            <div
              key={i}
              className="card"
              style={{
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                padding: '30px 24px'
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  opacity: 0.15,
                  position: 'absolute',
                  right: '18px',
                  top: '12px',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {st.num}
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  marginBottom: '18px'
                }}
              >
                {st.num}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                {st.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ margin: '80px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '46px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
            Everything You Need for Academic Excellence
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto' }}>
            Built specifically for college students, school scholars, and competitive exam aspirants.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}
                >
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
          borderRadius: '24px',
          padding: '50px 30px',
          textAlign: 'center',
          color: '#FFFFFF',
          margin: '70px 0 20px',
          boxShadow: '0 12px 30px var(--primary-ring)'
        }}
      >
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '14px' }}>
          Ready to Ace Your Next Examination?
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.9)', maxWidth: '580px', margin: '0 auto 30px' }}>
          Join thousands of learners mastering their course materials with StudyMate's grounded AI assistant.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('upload')}
            className="btn btn-secondary btn-lg"
            style={{ backgroundColor: '#FFFFFF', color: 'var(--primary)', borderColor: '#FFFFFF' }}
          >
            <UploadCloud size={18} />
            <span>Upload Your Study Material</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="btn btn-ghost btn-lg"
            style={{ color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            <span>Open Dashboard</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--text-soft)',
          fontSize: '0.85rem',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} color="var(--primary)" />
          <span>StudyMate © 2026 — Built with Real AI & Grounded Document Extraction</span>
        </div>
        <div style={{ display: 'flex', gap: '18px' }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' }}>Dashboard</button>
          <button onClick={() => setActiveTab('settings')} style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' }}>API Settings</button>
          <button onClick={() => setActiveTab('library')} style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' }}>My Library</button>
        </div>
      </footer>
    </div>
  );
};

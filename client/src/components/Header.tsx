import React, { useEffect, useState } from 'react';
import { Sun, Moon, UploadCloud, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { DocumentItem } from '../types.js';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { activeTab, setActiveTab, preferences, selectedDocumentId, setSelectedDocumentId } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  useEffect(() => {
    api.getDocuments().then(res => {
      setDocs(res.documents || []);
      if (!selectedDocumentId && res.documents?.length > 0) {
        setSelectedDocumentId(res.documents[0].id);
      }
    }).catch(() => {});
  }, [activeTab]);

  const titles: Record<string, { title: string; subtitle: string }> = {
    landing: { title: 'StudyMate', subtitle: 'Personal AI Study Assistant' },
    dashboard: { title: 'Student Dashboard', subtitle: 'Track your study goals, recent notes, and review streaks' },
    library: { title: 'My Library', subtitle: 'All your documents, notes, quizzes, and decks in one place' },
    upload: { title: 'Upload Material', subtitle: 'Extract and analyze PDFs, DOCX files, and study notes' },
    notes: { title: 'AI Notes Generator', subtitle: 'Generate structured summaries, exam sheets, and editable notes' },
    chat: { title: 'Ask Your PDF', subtitle: 'Ask questions grounded strictly in your uploaded materials' },
    quiz: { title: 'Quiz & Practice', subtitle: 'Practice MCQs, timed exams, and target your weak topics' },
    flashcards: { title: 'Flashcards & Spaced Repetition', subtitle: 'Review active recall decks powered by the SM-2 algorithm' },
    planner: { title: 'Personalized Study Planner', subtitle: 'Generate day-by-day revision schedules tailored to your exams' },
    tools: { title: 'AI Learning Tools', subtitle: 'Concept explainer, visual mind maps, and exam questions' },
    analytics: { title: 'Progress & Analytics', subtitle: 'Performance charts, topic accuracy, and streak tracking' },
    settings: { title: 'Settings & Preferences', subtitle: 'Configure theme, language, and Gemini or OpenAI API keys' },
  };

  const current = titles[activeTab] || { title: 'StudyMate', subtitle: 'AI Study Assistant' };

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'all 0.2s ease'
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {current.subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Active Document Selector (if documents exist) */}
        {docs.length > 0 && activeTab !== 'landing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} color="var(--primary)" />
            <select
              value={selectedDocumentId || ''}
              onChange={e => setSelectedDocumentId(e.target.value)}
              className="select"
              style={{ padding: '6px 12px', fontSize: '0.82rem', maxWidth: '200px' }}
              title="Active Study Document"
            >
              {docs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* AI Key Status Badge */}
        {preferences?.hasApiKeyOverride ? (
          <div
            onClick={() => setActiveTab('settings')}
            className="badge badge-success"
            style={{ cursor: 'pointer', padding: '6px 10px', fontSize: '0.78rem' }}
            title="Live AI API is configured and active"
          >
            <Sparkles size={13} />
            <span>Live AI Active ({preferences.aiProvider.toUpperCase()})</span>
          </div>
        ) : (
          <div
            onClick={() => setActiveTab('settings')}
            className="badge badge-warning"
            style={{ cursor: 'pointer', padding: '6px 10px', fontSize: '0.78rem' }}
            title="Click to connect your Gemini or OpenAI API Key in Settings"
          >
            <AlertCircle size={13} />
            <span>Connect AI Key</span>
          </div>
        )}

        {/* Quick Upload Button */}
        {activeTab !== 'upload' && activeTab !== 'landing' && (
          <button
            onClick={() => setActiveTab('upload')}
            className="btn btn-primary btn-sm"
          >
            <UploadCloud size={15} />
            <span>Upload</span>
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-main)',
            transition: 'all 0.18s ease'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
};

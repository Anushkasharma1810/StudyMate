import React, { useEffect, useState } from 'react';
import { Sun, Moon, UploadCloud, Sparkles, FileText, FolderCog, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { DocumentItem } from '../types.js';

interface HeaderProps {
  isMobile: boolean;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobile, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { activeTab, setActiveTab, preferences, selectedDocumentId, setSelectedDocumentId, setDocManagerOpen } = useAuth();
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
    settings: { title: 'Settings & Preferences', subtitle: 'Manage your theme, study language, and account' },
  };

  const current = titles[activeTab] || { title: 'StudyMate', subtitle: 'AI Study Assistant' };

  return (
    <header
      style={{
        height: isMobile ? '60px' : '68px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: isMobile ? '0 12px' : '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {/* Phone: hamburger button opens the sidebar drawer */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            title="Menu"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)',
              flexShrink: 0
            }}
          >
            <Menu size={20} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: isMobile ? '1.02rem' : '1.25rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {current.title}
          </h1>
          {!isMobile && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {current.subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '14px', flexShrink: 0 }}>
        {/* Active Document Selector (if documents exist) */}
        {docs.length > 0 && activeTab !== 'landing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!isMobile && <FileText size={15} color="var(--primary)" />}
            <select
              value={selectedDocumentId || ''}
              onChange={e => setSelectedDocumentId(e.target.value)}
              className="select"
              style={{ padding: '6px 10px', fontSize: '0.82rem', maxWidth: isMobile ? '110px' : '200px' }}
              title="Active Study Document"
            >
              {docs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setDocManagerOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px' }}
              title="Manage documents (delete / replace)"
              aria-label="Manage documents"
            >
              <FolderCog size={16} />
            </button>
          </div>
        )}

        {/* AI is set up by the site owner on the server — users never deal with API keys */}
        {preferences?.aiAvailable && !isMobile && (
          <div
            className="badge badge-success"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="AI features are ready to use"
          >
            <Sparkles size={13} />
            <span>AI Powered</span>
          </div>
        )}

        {/* Quick Upload Button */}
        {activeTab !== 'upload' && activeTab !== 'landing' && (
          <button
            onClick={() => setActiveTab('upload')}
            className="btn btn-primary btn-sm"
            style={isMobile ? { padding: '8px' } : undefined}
            title="Upload"
            aria-label="Upload"
          >
            <UploadCloud size={15} />
            {!isMobile && <span>Upload</span>}
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

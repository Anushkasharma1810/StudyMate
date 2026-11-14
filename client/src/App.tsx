import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { AuthModal } from './components/AuthModal.js';
import { DocumentManagerModal } from './components/DocumentManagerModal.js';
import { LandingView } from './views/LandingView.js';
import { DashboardView } from './views/DashboardView.js';
import { UploadView } from './views/UploadView.js';
import { NotesView } from './views/NotesView.js';
import { ChatView } from './views/ChatView.js';
import { QuizView } from './views/QuizView.js';
import { FlashcardsView } from './views/FlashcardsView.js';
import { PlannerView } from './views/PlannerView.js';
import { ToolsView } from './views/ToolsView.js';
import { LibraryView } from './views/LibraryView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { SettingsView } from './views/SettingsView.js';

// Phones and small tablets get a slide-in drawer instead of a fixed sidebar
const MOBILE_QUERY = '(max-width: 860px)';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

const MainLayout: React.FC = () => {
  const { activeTab, sessionKey, docsVersion, loading, user, refreshProfile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the drawer when switching to desktop size or after login/logout
  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [sessionKey]);

  // While the drawer is open: lock page scroll behind it, and close it with Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileNavOpen]);

  // Wait until this visitor's own workspace (guest or account) is ready
  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', background: 'var(--bg-app)', color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>
        {loading ? (
          <>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.9rem' }}>Preparing your workspace...</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '0.95rem' }}>Could not connect to the StudyMate server.</span>
            <button className="btn btn-primary" onClick={() => refreshProfile()}>Try Again</button>
          </>
        )}
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'upload':
        return <UploadView />;
      case 'notes':
        return <NotesView />;
      case 'chat':
        return <ChatView />;
      case 'quiz':
        return <QuizView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'planner':
        return <PlannerView />;
      case 'tools':
        return <ToolsView />;
      case 'library':
        return <LibraryView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-app)' }}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      {/* Dimmed backdrop behind the phone drawer — tap it to close */}
      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 890,
            animation: 'fadeIn 0.2s ease'
          }}
        />
      )}
      {/* Remount header + views on login/logout (no previous user's state lingers)
          and after documents are deleted/replaced (every page reloads its document list) */}
      <div key={`${sessionKey}-${docsVersion}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Header isMobile={isMobile} onMenuClick={() => setMobileNavOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderView()}
        </main>
      </div>
      <AuthModal />
      <DocumentManagerModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

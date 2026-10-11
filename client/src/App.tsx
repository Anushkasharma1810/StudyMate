import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
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

const MainLayout: React.FC = () => {
  const { activeTab } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderView()}
        </main>
      </div>
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

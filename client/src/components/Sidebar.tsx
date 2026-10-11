import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderArchive,
  UploadCloud,
  FileText,
  MessageSquareText,
  GraduationCap,
  Sparkles,
  CalendarDays,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Home,
  LogOut,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'My Library', icon: FolderArchive },
    { id: 'upload', label: 'Upload Material', icon: UploadCloud },
    { id: 'notes', label: 'AI Notes', icon: FileText },
    { id: 'chat', label: 'Ask Your PDF', icon: MessageSquareText },
    { id: 'quiz', label: 'Quiz & Practice', icon: GraduationCap },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'planner', label: 'Study Planner', icon: CalendarDays },
    { id: 'tools', label: 'Learning Tools', icon: Sparkles },
    { id: 'analytics', label: 'Progress & Stats', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '18px 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          minHeight: '68px'
        }}
      >
        <button
          onClick={() => setActiveTab('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px var(--primary-ring)',
              flexShrink: 0
            }}
          >
            <BookOpen size={20} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                StudyMate
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', fontWeight: 500 }}>
                AI Academic Partner
              </div>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        {/* Landing link */}
        <button
          onClick={() => setActiveTab('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: collapsed ? '10px 0' : '10px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'landing' ? 'var(--primary-light)' : 'transparent',
            color: activeTab === 'landing' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'landing' ? 600 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title={collapsed ? 'Home Landing' : undefined}
        >
          <Home size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Home Landing</span>}
        </button>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 8px' }} />

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '11px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} style={{ flexShrink: 0, color: isActive ? 'var(--primary)' : undefined }} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: '2px',
                    top: '20%',
                    bottom: '20%',
                    width: '3px',
                    borderRadius: '2px',
                    backgroundColor: 'var(--primary)'
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Session */}
      <div
        style={{
          padding: collapsed ? '14px 8px' : '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Expand Sidebar"
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  flexShrink: 0
                }}
              >
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Guest Student'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'demo@studymate.ai'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

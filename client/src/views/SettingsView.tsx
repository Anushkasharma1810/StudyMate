import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Save,
  Check,
  AlertCircle,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

export const SettingsView: React.FC = () => {
  const { user, preferences, updatePreferences, isGuest, openAuthModal, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when preferences are loaded or updated from the server
  useEffect(() => {
    if (preferences?.language) setLanguage(preferences.language);
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      await updatePreferences({ theme, language });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          Settings
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Manage your theme, study language, and account.
        </p>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-green)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.92rem',
            marginBottom: '24px'
          }}
        >
          <Check size={18} style={{ flexShrink: 0 }} />
          <span>Settings saved!</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--accent-rose)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.92rem',
            marginBottom: '24px'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}


      {/* Interface & Language Preferences */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>
          Display & Language
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Interface Theme
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setTheme('light')}
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ flex: 1 }}
              >
                <Sun size={15} />
                <span>Warm Ivory (Light)</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ flex: 1 }}
              >
                <Moon size={15} />
                <span>Slate Charcoal (Dark)</span>
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Default Study Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as any)}
              className="select"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="hinglish">Hinglish (Hindi-English Blend)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px' }}>
          Account Information
        </h3>
        <div className="account-row">
          <div className="account-identity">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {isGuest ? 'G' : (user?.name?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div className="account-text">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {isGuest ? 'Guest Student' : user?.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isGuest
                  ? 'Private guest workspace on this browser. Sign up to keep your work and use it on any device.'
                  : `${user?.email} • Local SQLite Storage`}
              </div>
            </div>
          </div>

          <div className="account-actions">
            {isGuest ? (
              <>
                <button className="btn btn-secondary" onClick={() => openAuthModal('login')}>
                  <LogIn size={16} />
                  <span>Log In</span>
                </button>
                <button className="btn btn-primary" onClick={() => openAuthModal('signup')}>
                  <UserPlus size={16} />
                  <span>Sign Up</span>
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={logout}>
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '160px' }}
        >
          {saving ? (
            <>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

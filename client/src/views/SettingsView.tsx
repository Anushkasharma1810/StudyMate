import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Key,
  Globe,
  Sun,
  Moon,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

export const SettingsView: React.FC = () => {
  const { user, preferences, updatePreferences } = useAuth();
  const { theme, setTheme } = useTheme();

  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when preferences are loaded or updated from the server
  useEffect(() => {
    if (preferences) {
      if (preferences.aiProvider) setAiProvider(preferences.aiProvider);
      if (preferences.language) setLanguage(preferences.language);
    }
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      await updatePreferences({
        theme,
        language,
        aiProvider,
        apiKeyOverride: apiKey.trim() ? apiKey.trim() : undefined
      });
      setApiKey(''); // Clear the input field for security so raw key is not displayed
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!confirm('Are you sure you want to remove your custom API key? StudyMate will revert to local heuristic processing.')) {
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await updatePreferences({
        theme,
        language,
        aiProvider,
        apiKeyOverride: ''
      });
      setApiKey('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove API key');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          Settings & AI Configuration
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Manage your theme, study language, and configure your live AI model credentials.
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
          <span>Settings saved! Your AI provider and key configuration are now active and persisted.</span>
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

      {/* AI Provider Configuration Card */}
      <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Provider & API Key</h3>
          </div>
          {preferences?.hasApiKeyOverride ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success">
                ✓ Live Key Active ({preferences.aiProvider?.toUpperCase()}: {preferences.keyPreview || '••••••••'})
              </span>
              <button
                onClick={handleRemoveKey}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--accent-rose)', padding: '4px 8px', fontSize: '0.78rem' }}
                title="Remove API Key"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          ) : (
            <span className="badge badge-warning">Fallback / Local Heuristics</span>
          )}
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
          StudyMate supports <strong>Google Gemini</strong> and <strong>OpenAI</strong>. Enter your personal API key below to enable real-time model synthesis for notes, quizzes, and grounded document chat. Keys are stored securely in local SQLite and never logged or exposed.
        </p>

        {/* Provider Choice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div
            onClick={() => setAiProvider('gemini')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${aiProvider === 'gemini' ? 'var(--primary)' : 'var(--border-subtle)'}`,
              background: aiProvider === 'gemini' ? 'var(--primary-light)' : 'var(--bg-subtle)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Google Gemini (Recommended)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>
              Uses Gemini 1.5 / 2.5 Flash
            </div>
          </div>

          <div
            onClick={() => setAiProvider('openai')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${aiProvider === 'openai' ? 'var(--primary)' : 'var(--border-subtle)'}`,
              background: aiProvider === 'openai' ? 'var(--primary-light)' : 'var(--bg-subtle)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              OpenAI
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>
              Uses GPT-4o-mini
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            {aiProvider === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="input"
            placeholder={
              preferences?.hasApiKeyOverride
                ? `Key is set (${preferences.keyPreview || '••••••••'}). Paste a new key to update, or leave blank to keep.`
                : aiProvider === 'gemini'
                ? 'Paste your Gemini API key (AIzaSy...)'
                : 'Paste your OpenAI API key (sk-...)'
            }
          />
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            Need a key? Get one from{' '}
            {aiProvider === 'gemini' ? (
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Google AI Studio (free tier available)
              </a>
            ) : (
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                OpenAI API Keys dashboard
              </a>
            )}
          </span>
          <ExternalLink size={14} color="var(--primary)" />
        </div>
      </div>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
              fontWeight: 700
            }}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {user?.name || 'Alex Morgan'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {user?.email || 'demo@studymate.ai'} • Local SQLite Storage
            </div>
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

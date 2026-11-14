import React, { useEffect, useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const AuthModal: React.FC = () => {
  const { authModal, openAuthModal, closeAuthModal, login, signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error whenever the mode changes or the modal opens
  useEffect(() => {
    setError(null);
  }, [authModal]);

  // Close on Escape
  useEffect(() => {
    if (!authModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModal, closeAuthModal]);

  if (!authModal) return null;
  const isSignup = authModal === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignup && !name.trim()) return setError('Please enter your name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(name.trim(), email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    marginBottom: '6px'
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div
        className="modal-content auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h2 id="auth-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {isSignup ? 'Save your notes, quizzes and progress.' : 'Log in to continue studying.'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="auth-toggle">
          <button
            type="button"
            className={!isSignup ? 'active' : ''}
            onClick={() => openAuthModal('login')}
          >
            Log In
          </button>
          <button
            type="button"
            className={isSignup ? 'active' : ''}
            onClick={() => openAuthModal('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignup && (
            <div>
              <label style={labelStyle} htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                autoFocus
              />
            </div>
          )}
          <div>
            <label style={labelStyle} htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus={!isSignup}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                fontSize: '0.84rem'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '4px' }}>
            {submitting ? (
              <span>Please wait...</span>
            ) : isSignup ? (
              <>
                <UserPlus size={17} />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn size={17} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '16px', marginBottom: 0 }}>
          {isSignup ? 'Already have an account? ' : "New to StudyMate? "}
          <button
            type="button"
            onClick={() => openAuthModal(isSignup ? 'login' : 'signup')}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
          >
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
};

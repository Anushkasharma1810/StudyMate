import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserPreferences } from '../types.js';
import { api } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isGuest: boolean;
  authModal: 'login' | 'signup' | null;
  openAuthModal: (mode: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  sessionKey: number;
  docManagerOpen: boolean;
  setDocManagerOpen: (open: boolean) => void;
  docsVersion: number;
  notifyDocsChanged: () => void;
  refreshProfile: () => Promise<void>;
  updatePreferences: (prefs: Partial<Pick<UserPreferences, 'theme' | 'language'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

const TOKEN_KEY = 'studymate_token';
// Old builds shared one demo account between all visitors — never reuse it
const LEGACY_SHARED_DEMO_ID = 'user_demo_studymate_001';

const readToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
const writeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  // Bumped on every login/logout so the whole UI remounts with fresh state
  const [sessionKey, setSessionKey] = useState(0);
  const [docManagerOpen, setDocManagerOpen] = useState(false);
  // Bumped after documents are deleted/replaced so views reload their document lists
  const [docsVersion, setDocsVersion] = useState(0);
  const notifyDocsChanged = () => setDocsVersion(v => v + 1);

  // Guest = private, empty workspace for this browser without a real account
  const isGuest = !user || Boolean(user.isGuest);

  /** Starts a brand-new, empty guest workspace for this browser. */
  const startGuestSession = async () => {
    const res = await api.createGuest();
    writeToken(res.token);
  };

  const refreshProfile = async () => {
    try {
      if (!readToken()) await startGuestSession();
      let res = await api.getMe();

      if (res.user?.id === LEGACY_SHARED_DEMO_ID) {
        // Stale token for the old shared demo account → give this browser its own workspace
        await startGuestSession();
        res = await api.getMe();
      }
      setUser(res.user);
      setPreferences(res.preferences);
    } catch {
      // Token expired / account removed → start fresh as a guest
      try {
        writeToken(null);
        await startGuestSession();
        const res = await api.getMe();
        setUser(res.user);
        setPreferences(res.preferences);
      } catch {
        setUser(null); // server unreachable
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  // Clears all in-memory, per-user UI state so the next user starts fresh.
  // Their saved data (notes, chats, quizzes...) stays on the server per account.
  const resetClientState = () => {
    setSelectedDocumentId(null);
    setSessionKey(k => k + 1);
    setDocManagerOpen(false);
    setAuthModal(null);
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    writeToken(res.token);
    setUser(res.user);
    await refreshProfile();
    resetClientState();
    setActiveTab('dashboard');
  };

  const signup = async (name: string, email: string, pass: string) => {
    // Sent with the current guest token: the server upgrades the guest workspace,
    // so anything uploaded before signing up is kept in the new account.
    const res = await api.signup({ name, email, password: pass });
    writeToken(res.token);
    setUser(res.user);
    await refreshProfile();
    resetClientState();
    setActiveTab('dashboard');
  };

  const logout = async () => {
    setLoading(true);
    writeToken(null);
    setUser(null);
    setActiveTab('landing');
    await refreshProfile(); // creates a fresh, empty guest workspace
    resetClientState();
  };

  const openAuthModal = (mode: 'login' | 'signup') => setAuthModal(mode);
  const closeAuthModal = () => setAuthModal(null);

  const updatePreferences = async (prefs: any) => {
    await api.updatePreferences(prefs);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        loading,
        activeTab,
        setActiveTab,
        selectedDocumentId,
        setSelectedDocumentId,
        login,
        signup,
        logout,
        isGuest,
        authModal,
        openAuthModal,
        closeAuthModal,
        sessionKey,
        docManagerOpen,
        setDocManagerOpen,
        docsVersion,
        notifyDocsChanged,
        refreshProfile,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

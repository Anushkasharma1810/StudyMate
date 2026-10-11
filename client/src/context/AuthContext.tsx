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
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences & { apiKeyOverride?: string }>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const refreshProfile = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setPreferences(res.preferences);
    } catch {
      // If no valid auth token, fall back to guest demo profile
      setUser({
        id: 'user_demo_studymate_001',
        name: 'Alex Morgan',
        email: 'demo@studymate.ai'
      });
      setPreferences({
        theme: 'light',
        language: 'en',
        aiProvider: 'gemini',
        hasApiKeyOverride: false
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('studymate_token', res.token);
    setUser(res.user);
    await refreshProfile();
    setActiveTab('dashboard');
  };

  const signup = async (name: string, email: string, pass: string) => {
    const res = await api.signup({ name, email, password: pass });
    localStorage.setItem('studymate_token', res.token);
    setUser(res.user);
    await refreshProfile();
    setActiveTab('dashboard');
  };

  const demoLogin = async () => {
    try {
      const res = await api.demoLogin();
      localStorage.setItem('studymate_token', res.token);
      setUser(res.user);
      await refreshProfile();
    } catch {
      setUser({
        id: 'user_demo_studymate_001',
        name: 'Alex Morgan',
        email: 'demo@studymate.ai'
      });
    }
    setActiveTab('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('studymate_token');
    setUser(null);
    setActiveTab('landing');
  };

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
        demoLogin,
        logout,
        refreshProfile,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

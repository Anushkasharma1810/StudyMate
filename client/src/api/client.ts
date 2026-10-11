const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('studymate_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return { 'x-user-id': 'user_demo_studymate_001' };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data;
}

export const api = {
  // Health
  getHealth: () => request<any>('/health'),

  // Auth
  login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (payload: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  demoLogin: () => request<any>('/auth/demo-login', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),
  updatePreferences: (prefs: any) => request<any>('/auth/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),

  // Documents
  getDocuments: (search?: string, subject?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (subject) params.append('subject', subject);
    return request<{ documents: any[] }>(`/documents?${params.toString()}`);
  },
  getDocument: (id: string) => request<any>(`/documents/${id}`),
  uploadDocument: (formData: FormData) => request<any>('/documents/upload', { method: 'POST', body: formData }),
  deleteDocument: (id: string) => request<any>(`/documents/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: () => request<{ notes: any[] }>('/notes'),
  getNote: (id: string) => request<{ note: any }>(`/notes/${id}`),
  generateNotes: (payload: any) => request<any>('/notes/generate', { method: 'POST', body: JSON.stringify(payload) }),
  updateNote: (id: string, payload: any) => request<any>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteNote: (id: string) => request<any>(`/notes/${id}`, { method: 'DELETE' }),
  transformNoteText: (payload: any) => request<any>('/notes/transform', { method: 'POST', body: JSON.stringify(payload) }),

  // Chat (Ask Your PDF)
  getChatSessions: (documentId?: string) => {
    const url = documentId ? `/chat/sessions?documentId=${documentId}` : '/chat/sessions';
    return request<{ sessions: any[] }>(url);
  },
  createChatSession: (payload: any) => request<any>('/chat/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  getChatMessages: (sessionId: string) => request<any>(`/chat/sessions/${sessionId}/messages`),
  sendChatMessage: (sessionId: string, message: string, language: string = 'en') =>
    request<any>(`/chat/sessions/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ message, language }) }),

  // Quizzes
  getQuizzes: () => request<{ quizzes: any[] }>('/quizzes'),
  getQuiz: (id: string) => request<any>(`/quizzes/${id}`),
  generateQuiz: (payload: any) => request<any>('/quizzes/generate', { method: 'POST', body: JSON.stringify(payload) }),
  submitQuiz: (id: string, answers: any, timeSpentSecs: number) =>
    request<any>(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers, timeSpentSecs }) }),
  getQuizAttempt: (attemptId: string) => request<any>(`/quizzes/attempts/${attemptId}`),
  practiceMistakes: () => request<any>('/quizzes/practice-mistakes', { method: 'POST' }),

  // Flashcards
  getFlashcardDecks: () => request<{ decks: any[] }>('/flashcards/decks'),
  getFlashcardDeck: (id: string) => request<any>(`/flashcards/decks/${id}`),
  generateFlashcards: (payload: any) => request<any>('/flashcards/generate', { method: 'POST', body: JSON.stringify(payload) }),
  addCard: (deckId: string, card: any) => request<any>(`/flashcards/decks/${deckId}/cards`, { method: 'POST', body: JSON.stringify(card) }),
  deleteDeck: (id: string) => request<any>(`/flashcards/decks/${id}`, { method: 'DELETE' }),
  reviewCard: (cardId: string, rating: number) =>
    request<any>(`/flashcards/${cardId}/review`, { method: 'POST', body: JSON.stringify({ rating }) }),

  // Study Planner
  getPlannerTasks: () => request<{ tasks: any[]; plans: any[] }>('/planner/tasks'),
  generatePlan: (payload: any) => request<any>('/planner/generate', { method: 'POST', body: JSON.stringify(payload) }),
  toggleTask: (taskId: string) => request<any>(`/planner/tasks/${taskId}/toggle`, { method: 'PUT' }),
  rescheduleTask: (taskId: string, dueDate: string) =>
    request<any>(`/planner/tasks/${taskId}/reschedule`, { method: 'PUT', body: JSON.stringify({ dueDate }) }),
  createTask: (payload: any) => request<any>('/planner/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  deleteTask: (taskId: string) => request<any>(`/planner/tasks/${taskId}`, { method: 'DELETE' }),

  // Additional Learning Tools
  explainConcept: (payload: any) => request<any>('/tools/explain-concept', { method: 'POST', body: JSON.stringify(payload) }),
  generateMindMap: (documentId: string) => request<any>('/tools/mind-map', { method: 'POST', body: JSON.stringify({ documentId }) }),
  compareSimplify: (payload: any) => request<any>('/tools/compare-simplify', { method: 'POST', body: JSON.stringify(payload) }),
  getImportantQuestions: (documentId: string) => request<any>('/tools/important-questions', { method: 'POST', body: JSON.stringify({ documentId }) }),

  // Analytics & Dashboard
  getDashboardAnalytics: () => request<any>('/analytics/dashboard')
};

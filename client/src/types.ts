export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'hinglish';
  aiProvider: 'gemini' | 'openai';
  hasApiKeyOverride: boolean;
  keyPreview?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  page_count: number;
  word_count: number;
  subject: string;
  processing_status: 'ready' | 'processing' | 'error';
  summary?: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  page_number: number;
  chunk_index: number;
  content: string;
  heading?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  note_type: 'summary' | 'exam' | 'detailed' | 'revision';
  language: 'en' | 'hi' | 'hinglish';
  learning_level: 'beginner' | 'college' | 'advanced';
  content: string;
  document_id?: string;
  document_title?: string;
  subject?: string;
  source_refs?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  document_id?: string;
  document_title?: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourcePages?: number[];
  suggestedQuestions?: string[];
  isAi?: boolean;
  warning?: string;
  created_at?: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'multi_select' | 'short_answer';
  options: string[] | null;
  correct_answer?: string;
  explanation?: string;
  source_page?: number;
  topic?: string;
}

export interface QuizItem {
  id: string;
  title: string;
  document_id?: string;
  document_title?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  question_count: number;
  mode: 'practice' | 'timed';
  time_limit_mins: number;
  attempts_count?: number;
  best_score?: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  difficulty: string;
  score: number;
  total_questions: number;
  accuracy_pct: number;
  time_spent_secs: number;
  completed_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source_ref?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interval_days: number;
  repetition_count: number;
  ease_factor: number;
  due_date: string;
  mastery_status: 'new' | 'learning' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  document_id?: string;
  document_title?: string;
  total_cards: number;
  due_today: number;
  mastered_count: number;
  learning_count: number;
  new_count: number;
  created_at: string;
}

export interface StudyTask {
  id: string;
  plan_id: string;
  title: string;
  topic: string;
  task_type: 'study' | 'quiz' | 'revision';
  due_date: string;
  duration_mins: number;
  is_completed: number;
  completed_at?: string;
  subject?: string;
}

export interface StudyPlan {
  id: string;
  subject: string;
  exam_date: string;
  daily_hours: number;
  confidence_level: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalDocuments: number;
  totalNotes: number;
  totalQuizzesAttempted: number;
  averageQuizScore: number;
  studyStreakDays: number;
  totalCards: number;
  cardsDueToday: number;
  cardsMastered: number;
  cardsLearning: number;
}

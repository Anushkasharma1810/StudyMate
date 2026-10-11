import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sliders,
  Check
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DocumentItem, QuizItem, QuizQuestion } from '../types.js';

export const QuizView: React.FC = () => {
  const { selectedDocumentId, setSelectedDocumentId, setActiveTab } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);

  // Generator settings
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [mode, setMode] = useState<'practice' | 'timed'>('practice');
  const [timeLimitMins, setTimeLimitMins] = useState(10);
  const [generating, setGenerating] = useState(false);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [gradedResult, setGradedResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const loadData = async () => {
    try {
      const [docsRes, quizzesRes] = await Promise.all([
        api.getDocuments(),
        api.getQuizzes()
      ]);
      setDocuments(docsRes.documents || []);
      setQuizzes(quizzesRes.quizzes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedDocumentId) {
      alert('Please select or upload a document first!');
      return;
    }
    setGenerating(true);
    setGradedResult(null);

    try {
      const res = await api.generateQuiz({
        documentId: selectedDocumentId,
        questionCount,
        difficulty,
        mode,
        timeLimitMins,
        questionTypes: ['mcq', 'true_false']
      });

      await startQuiz(res.quizId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const startQuiz = async (quizId: string) => {
    try {
      const res = await api.getQuiz(quizId);
      setActiveQuiz(res.quiz);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setGradedResult(null);

      if (res.quiz.mode === 'timed') {
        setTimeLeft((res.quiz.time_limit_mins || 10) * 60);
        setTimerActive(true);
      } else {
        setTimerActive(false);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectAnswer = (qId: string, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questions.length && timerActive && timeLeft > 5) {
      if (!confirm(`You have only answered ${answeredCount} of ${questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setTimerActive(false);

    try {
      const totalTime = (activeQuiz.time_limit_mins || 10) * 60 - timeLeft;
      const res = await api.submitQuiz(activeQuiz.id, userAnswers, Math.max(1, totalTime));
      setGradedResult(res);

      if (res.accuracyPct >= 70) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePracticeMistakes = async () => {
    try {
      const res = await api.practiceMistakes();
      await startQuiz(res.quizId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'No recorded mistakes yet.');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Quiz Mode Active View */}
      {activeQuiz && !gradedResult ? (
        <div className="card" style={{ padding: '30px', position: 'relative' }}>
          {/* Header with Title and Timer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeQuiz.title}</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', display: 'flex', gap: '10px' }}>
                <span>Difficulty: {activeQuiz.difficulty.toUpperCase()}</span>
                <span>•</span>
                <span>Mode: {activeQuiz.mode.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {activeQuiz.mode === 'timed' && (
                <div
                  className="badge"
                  style={{
                    background: timeLeft < 60 ? 'rgba(244, 63, 94, 0.15)' : 'var(--primary-light)',
                    color: timeLeft < 60 ? 'var(--accent-rose)' : 'var(--primary)',
                    fontSize: '0.9rem',
                    padding: '6px 14px'
                  }}
                >
                  <Clock size={16} />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}

              <button onClick={() => setActiveQuiz(null)} className="btn btn-ghost btn-sm">
                Exit Quiz
              </button>
            </div>
          </div>

          {/* Question Navigation Palette */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: isCurrent ? 'var(--primary-light)' : isAnswered ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-subtle)',
                    color: isCurrent ? 'var(--primary)' : isAnswered ? 'var(--accent-green)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question */}
          {questions[currentIndex] && (
            <div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-soft)', marginBottom: '8px', fontWeight: 600 }}>
                Question {currentIndex + 1} of {questions.length} • {questions[currentIndex].question_type.toUpperCase()}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '20px', color: 'var(--text-main)' }}>
                {questions[currentIndex].question_text}
              </h3>

              {/* Options */}
              {questions[currentIndex].options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                  {questions[currentIndex].options?.map((opt, optIdx) => {
                    const isSelected = userAnswers[questions[currentIndex].id] === opt;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectAnswer(questions[currentIndex].id, opt)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-soft)'}`,
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && <Check size={14} color="#FFFFFF" />}
                        </div>
                        <span style={{ fontSize: '0.92rem' }}>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Prev / Next & Submit Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: '10px 28px' }}
                  >
                    <span>{submitting ? 'Grading Answers...' : 'Submit Quiz'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="btn btn-primary"
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : gradedResult ? (
        /* Graded Results View */
        <div className="card" style={{ padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: gradedResult.accuracyPct >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: gradedResult.accuracyPct >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <GraduationCap size={36} />
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>
              Quiz Completed! Score: {gradedResult.score} / {gradedResult.totalQuestions}
            </h2>
            <div
              className={`badge ${gradedResult.accuracyPct >= 70 ? 'badge-success' : 'badge-warning'}`}
              style={{ fontSize: '1rem', padding: '6px 16px' }}
            >
              {gradedResult.accuracyPct}% Accuracy
            </div>
          </div>

          {/* Weak Topics detected */}
          {gradedResult.weakTopics && gradedResult.weakTopics.length > 0 && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <strong style={{ color: 'var(--accent-rose)' }}>Weak Topics Identified:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  You struggled with: {gradedResult.weakTopics.join(', ')}
                </p>
              </div>
              <button
                onClick={handlePracticeMistakes}
                className="btn btn-sm"
                style={{ background: 'var(--accent-rose)', color: '#FFFFFF', border: 'none' }}
              >
                <Sparkles size={14} />
                <span>Practice My Mistakes Now</span>
              </button>
            </div>
          )}

          {/* Question Review Breakdown */}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
            Question Review & Verified Explanations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {gradedResult.results?.map((r: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: `1px solid ${r.isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-soft)' }}>
                    QUESTION {idx + 1} • {r.topic}
                  </span>
                  <span className={`badge ${r.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                    {r.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                  {r.questionText}
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Your Answer: </span>
                  <strong style={{ color: r.isCorrect ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                    {r.userAnswer}
                  </strong>
                </div>

                {!r.isCorrect && (
                  <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Correct Answer: </span>
                    <strong style={{ color: 'var(--accent-green)' }}>
                      {r.correctAnswer}
                    </strong>
                  </div>
                )}

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}>
                  <strong>Explanation:</strong> {r.explanation}
                  {r.sourcePage && <span style={{ color: 'var(--primary)', marginLeft: '8px' }}>[Page {r.sourcePage}]</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button onClick={() => setGradedResult(null)} className="btn btn-primary">
              <RotateCcw size={16} />
              <span>Take Another Quiz</span>
            </button>
            <button onClick={() => setActiveTab('dashboard')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Generator Settings and Past Quizzes */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
                AI Quiz Generator & Practice Tests
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                Generate validated MCQs and timed exams directly from your uploaded materials.
              </p>
            </div>

            <button onClick={handlePracticeMistakes} className="btn btn-secondary btn-sm">
              <Sparkles size={14} color="var(--accent-rose)" />
              <span>Practice My Mistakes</span>
            </button>
          </div>

          {/* Generator Controls Card */}
          <div className="card" style={{ padding: '28px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>
              Configure New Quiz
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Target Study Material
                </label>
                <select
                  value={selectedDocumentId || ''}
                  onChange={e => setSelectedDocumentId(e.target.value)}
                  className="select"
                >
                  {documents.length === 0 ? (
                    <option value="">No documents uploaded</option>
                  ) : (
                    documents.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.page_count} pages)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="select"
                >
                  <option value={5}>5 Questions (Quick Test)</option>
                  <option value={10}>10 Questions (Standard)</option>
                  <option value={15}>15 Questions (Full Exam)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="select"
                >
                  <option value="easy">Easy (Definitions & Recall)</option>
                  <option value="medium">Medium (Analytical)</option>
                  <option value="hard">Hard (Complex Synthesis)</option>
                  <option value="mixed">Mixed Difficulty</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Quiz Mode
                </label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as any)}
                  className="select"
                >
                  <option value="practice">Practice Mode (Self-Paced)</option>
                  <option value="timed">Timed Test Mode</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateQuiz}
              disabled={generating || !selectedDocumentId}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              {generating ? (
                <>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <span>Synthesizing Exam Questions...</span>
                </>
              ) : (
                <>
                  <GraduationCap size={20} />
                  <span>Generate & Start Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Past Quizzes List */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
              Your Quiz Sets & Practice History
            </h3>

            {quizzes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-soft)' }}>
                <p style={{ fontSize: '0.9rem' }}>No quizzes generated yet. Configure options above to begin.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {quizzes.map(q => (
                  <div key={q.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="badge badge-primary">{q.difficulty.toUpperCase()}</span>
                        {q.best_score !== null && q.best_score !== undefined && (
                          <span className="badge badge-success">Best: {q.best_score}%</span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{q.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '14px' }}>
                        {q.question_count} Questions • {q.attempts_count || 0} Attempts
                      </p>
                    </div>

                    <button onClick={() => startQuiz(q.id)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Start Practice
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DocumentItem, Flashcard, FlashcardDeck } from '../types.js';

export const FlashcardsView: React.FC = () => {
  const { selectedDocumentId, setSelectedDocumentId, setActiveTab } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cardCount, setCardCount] = useState(8);

  // New card modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, decksRes] = await Promise.all([
        api.getDocuments(),
        api.getFlashcardDecks()
      ]);
      setDocuments(docsRes.documents || []);
      setDecks(decksRes.decks || []);

      if (decksRes.decks?.length > 0) {
        selectDeck(decksRes.decks[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectDeck = async (deckId: string) => {
    try {
      const res = await api.getFlashcardDeck(deckId);
      setActiveDeck(res.deck);
      setCards(res.cards || []);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateDeck = async () => {
    if (!selectedDocumentId) {
      alert('Please select or upload a document first!');
      return;
    }
    setGenerating(true);

    try {
      const res = await api.generateFlashcards({
        documentId: selectedDocumentId,
        cardCount
      });
      await loadData();
      await selectDeck(res.deckId);
    } catch (err: any) {
      alert(err.message || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewRating = async (rating: number) => {
    if (!cards[currentIndex]) return;
    const currentCard = cards[currentIndex];

    try {
      const res = await api.reviewCard(currentCard.id, rating);
      // Update local card status
      setCards(prev => prev.map((c, idx) => idx === currentIndex ? { ...c, mastery_status: res.masteryStatus } : c));

      // Advance to next card
      if (currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        alert('🎉 You have reviewed all cards in this deck session!');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleShuffle = () => {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleAddCard = async () => {
    if (!activeDeck || !newFront.trim() || !newBack.trim()) return;
    try {
      await api.addCard(activeDeck.id, {
        front: newFront,
        back: newBack
      });
      setShowAddModal(false);
      setNewFront('');
      setNewBack('');
      selectDeck(activeDeck.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;
    try {
      await api.deleteDeck(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            Flashcards & Spaced Repetition (SM-2)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Active recall intervals calculated based on your review ratings to optimize memory retention.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedDocumentId || ''}
            onChange={e => setSelectedDocumentId(e.target.value)}
            className="select"
            style={{ maxWidth: '240px' }}
          >
            {documents.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>

          <button
            onClick={handleGenerateDeck}
            disabled={generating || !selectedDocumentId}
            className="btn btn-primary"
          >
            {generating ? (
              <>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <span>Extracting Cards...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Deck</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Flashcard Interactive Area */}
      {activeDeck && cards.length > 0 ? (
        <div>
          {/* Deck Header & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{activeDeck.title}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', display: 'flex', gap: '10px', marginTop: '2px' }}>
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>•</span>
                <span>Due Today: {activeDeck.due_today || 0}</span>
                <span>•</span>
                <span>Mastered: {activeDeck.mastered_count || 0}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleShuffle} className="btn btn-secondary btn-sm" title="Shuffle Deck">
                <Shuffle size={14} />
                <span>Shuffle</span>
              </button>
              <button onClick={() => setShowAddModal(true)} className="btn btn-secondary btn-sm" title="Add Card">
                <Plus size={14} />
                <span>Add Card</span>
              </button>
              <button onClick={() => handleDeleteDeck(activeDeck.id)} className="btn btn-ghost btn-sm" title="Delete Deck" style={{ color: 'var(--accent-rose)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* 3D Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              perspective: '1000px',
              height: '340px',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'none'
              }}
            >
              {/* Front Side */}
              <div
                className="card"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '36px',
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <span className="badge badge-primary" style={{ position: 'absolute', top: '20px', left: '20px' }}>
                  FRONT • {currentCard?.difficulty?.toUpperCase() || 'QUESTION'}
                </span>
                <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                  {currentCard?.source_ref || 'Reference'}
                </span>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '80%', lineHeight: 1.5 }}>
                  {currentCard?.front}
                </h3>

                <span style={{ position: 'absolute', bottom: '20px', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                  Click or press Space to reveal answer
                </span>
              </div>

              {/* Back Side */}
              <div
                className="card"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '36px',
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--primary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <span className="badge badge-success" style={{ position: 'absolute', top: '20px', left: '20px' }}>
                  ANSWER / EXPLANATION
                </span>
                <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Status: {currentCard?.mastery_status?.toUpperCase() || 'LEARNING'}
                </span>

                <p style={{ fontSize: '1.15rem', color: 'var(--text-main)', maxWidth: '85%', lineHeight: 1.6 }}>
                  {currentCard?.back}
                </p>

                <span style={{ position: 'absolute', bottom: '20px', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                  Rate your recall below to schedule next review
                </span>
              </div>
            </div>
          </div>

          {/* Spaced Repetition Review Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleReviewRating(1)}
              className="btn btn-secondary btn-lg"
              style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--accent-rose)' }}
            >
              <X size={18} />
              <span>Need Practice (1 Day)</span>
            </button>

            <button
              onClick={() => handleReviewRating(3)}
              className="btn btn-secondary btn-lg"
              style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-amber)' }}
            >
              <span>Good (3-6 Days)</span>
            </button>

            <button
              onClick={() => handleReviewRating(5)}
              className="btn btn-primary btn-lg"
              style={{ background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}
            >
              <Check size={18} />
              <span>Know It / Mastered</span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="btn btn-ghost"
            >
              <ChevronLeft size={16} />
              <span>Previous Card</span>
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1));
              }}
              disabled={currentIndex === cards.length - 1}
              className="btn btn-ghost"
            >
              <span>Next Card</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Decks State */
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Layers size={48} style={{ margin: '0 auto 16px', color: 'var(--primary)', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
            No Flashcard Decks Yet
          </h3>
          <p style={{ maxWidth: '440px', margin: '0 auto 24px', fontSize: '0.9rem' }}>
            Select an uploaded study document above and click "Generate Deck" to automatically extract definitions, formulas, and key concepts.
          </p>
          {documents.length > 0 ? (
            <button onClick={handleGenerateDeck} className="btn btn-primary">
              <Sparkles size={16} />
              <span>Generate Flashcards Now</span>
            </button>
          ) : (
            <button onClick={() => setActiveTab('upload')} className="btn btn-primary">
              <BookOpen size={16} />
              <span>Upload Material First</span>
            </button>
          )}
        </div>
      )}

      {/* Manual Card Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
              Add Custom Flashcard
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Front (Question or Term)
              </label>
              <input
                type="text"
                value={newFront}
                onChange={e => setNewFront(e.target.value)}
                className="input"
                placeholder="e.g. What is the Heisenberg Uncertainty Principle?"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Back (Answer or Definition)
              </label>
              <textarea
                value={newBack}
                onChange={e => setNewBack(e.target.value)}
                className="textarea"
                placeholder="e.g. Δx · Δp ≥ ℏ / 2. Simultaneous position and momentum cannot be known with arbitrary precision."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddCard} className="btn btn-primary">
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

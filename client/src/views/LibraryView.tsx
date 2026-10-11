import React, { useEffect, useState } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  FileText,
  GraduationCap,
  Layers,
  BookOpen,
  Trash2,
  ArrowRight,
  UploadCloud
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DocumentItem, FlashcardDeck, NoteItem, QuizItem } from '../types.js';

export const LibraryView: React.FC = () => {
  const { setSelectedDocumentId, setActiveTab } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<'all' | 'documents' | 'notes' | 'quizzes' | 'flashcards'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const [docsRes, notesRes, quizzesRes, decksRes] = await Promise.all([
        api.getDocuments(),
        api.getNotes(),
        api.getQuizzes(),
        api.getFlashcardDecks()
      ]);
      setDocuments(docsRes.documents || []);
      setNotes(notesRes.notes || []);
      setQuizzes(quizzesRes.quizzes || []);
      setDecks(decksRes.decks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and its associated chunks?')) return;
    try {
      await api.deleteDocument(id);
      loadLibrary();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      loadLibrary();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter items
  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedSubject === 'All' || d.subject === selectedSubject)
  );

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedSubject === 'All' || n.subject === selectedSubject)
  );

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDecks = decks.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 28px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            My Learning Library
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Access and manage all your documents, generated notes, practice quizzes, and flashcard decks.
          </p>
        </div>

        <button onClick={() => setActiveTab('upload')} className="btn btn-primary btn-sm">
          <UploadCloud size={16} />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-soft)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search resources by title or topic..."
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveFilter('all')}
            className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('documents')}
            className={`btn ${activeFilter === 'documents' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveFilter('notes')}
            className={`btn ${activeFilter === 'notes' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveFilter('quizzes')}
            className={`btn ${activeFilter === 'quizzes' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveFilter('flashcards')}
            className={`btn ${activeFilter === 'flashcards' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Flashcards ({decks.length})
          </button>
        </div>
      </div>

      {/* Resources Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* DOCUMENTS SECTION */}
        {(activeFilter === 'all' || activeFilter === 'documents') && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--primary)" />
              <span>Study Documents ({filteredDocs.length})</span>
            </h3>

            {filteredDocs.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>No documents matching query.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredDocs.map(doc => (
                  <div key={doc.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="badge badge-primary">{doc.file_type}</span>
                        <span className="badge badge-subtle">{doc.subject}</span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{doc.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '14px' }}>
                        {doc.page_count} pages • {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.word_count} words
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedDocumentId(doc.id);
                            setActiveTab('chat');
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDocumentId(doc.id);
                            setActiveTab('notes');
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Notes
                        </button>
                      </div>

                      <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTES SECTION */}
        {(activeFilter === 'all' || activeFilter === 'notes') && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-blue)" />
              <span>AI Generated Notes ({filteredNotes.length})</span>
            </h3>

            {filteredNotes.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>No notes matching query.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredNotes.map(n => (
                  <div key={n.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="badge badge-primary">{n.note_type}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>{n.language.toUpperCase()}</span>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{n.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '14px' }}>
                        Document: {n.document_title || 'General'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                      <button onClick={() => setActiveTab('notes')} className="btn btn-secondary btn-sm">
                        Open in Notes Editor
                      </button>
                      <button onClick={() => handleDeleteNote(n.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUIZZES SECTION */}
        {(activeFilter === 'all' || activeFilter === 'quizzes') && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="var(--accent-green)" />
              <span>Quizzes & Tests ({filteredQuizzes.length})</span>
            </h3>

            {filteredQuizzes.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>No quizzes found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredQuizzes.map(q => (
                  <div key={q.id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-success">{q.difficulty.toUpperCase()}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>{q.question_count} Questions</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>{q.title}</h4>
                    <button onClick={() => setActiveTab('quiz')} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Launch Practice Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FLASHCARDS SECTION */}
        {(activeFilter === 'all' || activeFilter === 'flashcards') && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-rose)" />
              <span>Flashcard Decks ({filteredDecks.length})</span>
            </h3>

            {filteredDecks.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>No flashcard decks found.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {filteredDecks.map(d => (
                  <div key={d.id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-primary">{d.total_cards} Cards</span>
                      <span className="badge badge-warning">{d.due_today} Due</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>{d.title}</h4>
                    <button onClick={() => setActiveTab('flashcards')} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Review Spaced Decks
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

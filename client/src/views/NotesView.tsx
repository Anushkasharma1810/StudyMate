import React, { useEffect, useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Printer,
  ChevronDown,
  Wand2,
  Trash2,
  Save,
  BookOpen,
  Plus,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DocumentItem, NoteItem } from '../types.js';
import { FormattedMarkdown } from '../components/FormattedMarkdown.js';

export const NotesView: React.FC = () => {
  const { selectedDocumentId, setSelectedDocumentId, setActiveTab } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);

  // Generator Options
  const [noteType, setNoteType] = useState<'detailed' | 'exam' | 'summary' | 'revision'>('detailed');
  const [length, setLength] = useState<'short' | 'balanced' | 'detailed'>('balanced');
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'college' | 'advanced'>('college');
  const [includeExamples, setIncludeExamples] = useState(true);
  const [highlightDefinitions, setHighlightDefinitions] = useState(true);
  const [highlightFormulas, setHighlightFormulas] = useState(true);
  const [generatePracticeQuestions, setGeneratePracticeQuestions] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [transforming, setTransforming] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, notesRes] = await Promise.all([
        api.getDocuments(),
        api.getNotes()
      ]);
      setDocuments(docsRes.documents || []);
      setNotes(notesRes.notes || []);

      if (notesRes.notes?.length > 0) {
        selectNote(notesRes.notes[0]);
      } else if (docsRes.documents?.length > 0 && !selectedDocumentId) {
        setSelectedDocumentId(docsRes.documents[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectNote = (n: NoteItem) => {
    setActiveNote(n);
    setEditorTitle(n.title);
    setEditorContent(n.content);
    if (n.document_id) {
      setSelectedDocumentId(n.document_id);
    }
  };

  const handleGenerateNotes = async () => {
    if (!selectedDocumentId) {
      alert('Please select or upload a document first!');
      return;
    }
    setGenerating(true);

    try {
      const res = await api.generateNotes({
        documentId: selectedDocumentId,
        noteType,
        length,
        language,
        learningLevel,
        includeExamples,
        highlightDefinitions,
        highlightFormulas,
        generatePracticeQuestions
      });

      const newNote = res.note;
      setNotes(prev => [newNote, ...prev]);
      selectNote(newNote);
      setShowConfig(false);
      if (res.note?.warning) {
        setNotice(res.note.warning);
      } else {
        setNotice(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate notes.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    setSaving(true);
    try {
      await api.updateNote(activeNote.id, {
        title: editorTitle,
        content: editorContent
      });
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title: editorTitle, content: editorContent } : n));
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(id);
      const remaining = notes.filter(n => n.id !== id);
      setNotes(remaining);
      if (remaining.length > 0) {
        selectNote(remaining[0]);
      } else {
        setActiveNote(null);
        setEditorContent('');
        setEditorTitle('');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editorTitle.replace(/\s+/g, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleTransform = async (action: 'simplify' | 'shorten' | 'expand' | 'examples') => {
    const textToProcess = selectedText.trim() || editorContent.slice(0, 500);
    if (!textToProcess) return;

    setTransforming(true);
    try {
      const res = await api.transformNoteText({ action, text: textToProcess });
      // Append transformed insight to note editor
      const updated = `${editorContent}\n\n---\n### 💡 AI Insight (${action.toUpperCase()})\n${res.result}\n`;
      setEditorContent(updated);
      if (activeNote) {
        await api.updateNote(activeNote.id, { content: updated });
      }
    } catch (err: any) {
      alert(err.message || 'Transformation failed');
    } finally {
      setTransforming(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 28px 60px' }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedDocumentId || ''}
            onChange={e => setSelectedDocumentId(e.target.value)}
            className="select"
            style={{ maxWidth: '280px', fontWeight: 600 }}
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

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="btn btn-secondary btn-sm"
          >
            <Sliders size={15} />
            <span>Options & Style</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleGenerateNotes}
            disabled={generating || !selectedDocumentId}
            className="btn btn-primary"
          >
            {generating ? (
              <>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <span>Generating Notes...</span>
              </>
            ) : (
              <>
                <Wand2 size={16} />
                <span>Generate New Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Notice Banner */}
      {notice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: 'var(--accent-amber, #d97706)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            marginBottom: '20px'
          }}
        >
          <AlertCircle size={17} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, lineHeight: 1.5 }}>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Generator Options Drawer (if toggled) */}
      {showConfig && (
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-focus)',
            padding: '22px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Notes Style
              </label>
              <select value={noteType} onChange={e => setNoteType(e.target.value as any)} className="select">
                <option value="detailed">Detailed Chapter Notes</option>
                <option value="exam">Exam-Oriented Notes</option>
                <option value="summary">Quick Summary</option>
                <option value="revision">Last-Minute Revision Sheet</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Depth / Length
              </label>
              <select value={length} onChange={e => setLength(e.target.value as any)} className="select">
                <option value="short">Short & Concise</option>
                <option value="balanced">Balanced</option>
                <option value="detailed">In-Depth & Comprehensive</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Language
              </label>
              <select value={language} onChange={e => setLanguage(e.target.value as any)} className="select">
                <option value="en">English</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="hinglish">Hinglish (Hindi-English Blend)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Target Learning Level
              </label>
              <select value={learningLevel} onChange={e => setLearningLevel(e.target.value as any)} className="select">
                <option value="beginner">Beginner / School</option>
                <option value="college">College Student / University</option>
                <option value="advanced">Advanced / Competitive Exam</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeExamples} onChange={e => setIncludeExamples(e.target.checked)} />
              Include Real-World Examples
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={highlightDefinitions} onChange={e => setHighlightDefinitions(e.target.checked)} />
              Highlight Definitions & Terms
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={highlightFormulas} onChange={e => setHighlightFormulas(e.target.checked)} />
              Highlight Formulas & Laws
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={generatePracticeQuestions} onChange={e => setGeneratePracticeQuestions(e.target.checked)} />
              Add Practice Questions
            </label>
          </div>
        </div>
      )}

      {/* Main Workspace Layout: Notes List Sidebar (left) + Editor & Preview (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Notes List Column */}
        <div className="card" style={{ padding: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Saved Notes ({notes.length})
            </span>
          </div>

          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-soft)' }}>
              <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.82rem' }}>No notes generated yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notes.map(n => {
                const isSelected = activeNote?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => selectNote(n)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-soft)' }}>
                      <span>{n.note_type}</span>
                      <span>{n.language.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor & Preview Column */}
        {activeNote ? (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header: Title edit & action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <input
                type="text"
                value={editorTitle}
                onChange={e => setEditorTitle(e.target.value)}
                className="input"
                style={{ fontSize: '1.25rem', fontWeight: 800, border: 'none', background: 'transparent', padding: '4px 0', maxWidth: '500px' }}
                placeholder="Note Title"
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={handleSaveNote} disabled={saving} className="btn btn-secondary btn-sm" title="Save changes">
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>

                <button onClick={handleCopy} className="btn btn-secondary btn-sm" title="Copy to clipboard">
                  {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button onClick={() => handleDownload('md')} className="btn btn-secondary btn-sm" title="Download Markdown">
                  <Download size={14} />
                  <span>.md</span>
                </button>

                <button onClick={() => handleDownload('txt')} className="btn btn-secondary btn-sm" title="Download Text">
                  <Download size={14} />
                  <span>.txt</span>
                </button>

                <button onClick={handlePrintPdf} className="btn btn-secondary btn-sm" title="Print as PDF">
                  <Printer size={14} />
                  <span>Print</span>
                </button>

                <button onClick={() => handleDeleteNote(activeNote.id)} className="btn btn-ghost btn-sm" title="Delete note" style={{ color: 'var(--accent-rose)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* AI Text Refinement Tools */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>AI Edit Tools:</span>
              <button
                onClick={() => handleTransform('simplify')}
                disabled={transforming}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                💡 Simplify Explanation
              </button>
              <button
                onClick={() => handleTransform('shorten')}
                disabled={transforming}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                ✂️ Condense to Bullets
              </button>
              <button
                onClick={() => handleTransform('expand')}
                disabled={transforming}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                🔬 Expand Deeply
              </button>
              <button
                onClick={() => handleTransform('examples')}
                disabled={transforming}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                🌍 Generate Examples
              </button>
            </div>

            {/* Split Editor / Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Raw Markdown Editor */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)', marginBottom: '6px' }}>
                  EDITABLE MARKDOWN SOURCE
                </label>
                <textarea
                  value={editorContent}
                  onChange={e => setEditorContent(e.target.value)}
                  onSelect={e => {
                    const target = e.target as HTMLTextAreaElement;
                    setSelectedText(target.value.substring(target.selectionStart, target.selectionEnd));
                  }}
                  className="textarea"
                  style={{
                    height: '520px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.86rem',
                    lineHeight: 1.6
                  }}
                  placeholder="Notes content..."
                />
              </div>

              {/* Formatted Render View */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)', marginBottom: '6px' }}>
                  FORMATTED STUDY VIEW
                </label>
                <div
                  style={{
                    height: '520px',
                    overflowY: 'auto',
                    padding: '16px 20px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {editorContent ? <FormattedMarkdown content={editorContent} /> : <span style={{ color: 'var(--text-soft)' }}>No content.</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 14px', color: 'var(--primary)', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
              No Note Selected
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Choose an existing note from the sidebar or click "Generate New Notes" to synthesize your study document.
            </p>
            {documents.length > 0 ? (
              <button onClick={handleGenerateNotes} className="btn btn-primary">
                <Wand2 size={16} />
                <span>Generate Notes for Active Document</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('upload')} className="btn btn-primary">
                <BookOpen size={16} />
                <span>Upload a Document First</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

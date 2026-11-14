import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Trash2, RefreshCw, UploadCloud, AlertCircle, FolderOpen } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DocumentItem } from '../types.js';

const ALLOWED_EXT = ['pdf', 'docx', 'txt', 'md'];
const MAX_SIZE = 30 * 1024 * 1024;

export const DocumentManagerModal: React.FC = () => {
  const {
    docManagerOpen,
    setDocManagerOpen,
    notifyDocsChanged,
    selectedDocumentId,
    setSelectedDocumentId,
    setActiveTab
  } = useAuth();

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyLabel, setBusyLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<DocumentItem | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      setDocs(res.documents || []);
    } catch (err: any) {
      setError(err.message || 'Could not load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docManagerOpen) {
      setError(null);
      setChanged(false);
      loadDocs();
    }
  }, [docManagerOpen]);

  const close = () => {
    if (busyId) return; // don't close mid-upload
    setDocManagerOpen(false);
    // Let every page reload its document list only if something actually changed
    if (changed) notifyDocsChanged();
  };

  useEffect(() => {
    if (!docManagerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!docManagerOpen) return null;

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(
      `Delete "${doc.title}"?\n\nThe file and its chats will be removed. ` +
      `Notes, quizzes and flashcards you already made from it will stay in your Library.`
    )) return;

    setBusyId(doc.id);
    setBusyLabel('Deleting...');
    setError(null);
    try {
      await api.deleteDocument(doc.id);
      const remaining = docs.filter(d => d.id !== doc.id);
      setDocs(remaining);
      if (selectedDocumentId === doc.id) {
        setSelectedDocumentId(remaining[0]?.id || null);
      }
      setChanged(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setBusyId(null);
    }
  };

  const startReplace = (doc: DocumentItem) => {
    replaceTarget.current = doc;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const oldDoc = replaceTarget.current;
    if (!file || !oldDoc) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXT.includes(ext)) {
      setError('Unsupported file type. Please choose a PDF, DOCX, TXT or MD file.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum supported size is 30MB.');
      return;
    }

    setBusyId(oldDoc.id);
    setBusyLabel('Uploading...');
    setError(null);
    try {
      // 1) Upload the new file first (same subject), so nothing is lost if it fails
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', oldDoc.subject || 'General');
      const res = await api.uploadDocument(formData);
      const newDoc: DocumentItem = res.document;

      // 2) Then remove the old one
      setBusyLabel('Removing old...');
      await api.deleteDocument(oldDoc.id);

      if (!selectedDocumentId || selectedDocumentId === oldDoc.id) {
        setSelectedDocumentId(newDoc.id);
      }
      setChanged(true);
      await loadDocs();
    } catch (err: any) {
      setError(err.message || 'Failed to replace document');
      await loadDocs();
    } finally {
      setBusyId(null);
      replaceTarget.current = null;
    }
  };

  const formatSize = (bytes: number) =>
    bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return (
    <div className="modal-overlay" onClick={close}>
      <div
        className="modal-content doc-manager"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-manager-title"
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          style={{ display: 'none' }}
          onChange={handleReplaceFile}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 id="doc-manager-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Manage Documents
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Delete a document, or replace it with a new file.
            </p>
          </div>
          <button onClick={close} className="btn btn-ghost btn-sm" style={{ padding: '6px' }} aria-label="Close" disabled={!!busyId}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              marginBottom: '12px',
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

        <div className="doc-manager-list">
          {loading && docs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-soft)', fontSize: '0.86rem' }}>Loading...</div>
          ) : docs.length === 0 ? (
            <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FolderOpen size={30} style={{ marginBottom: '8px', color: 'var(--text-soft)' }} />
              <div style={{ fontSize: '0.88rem' }}>No documents uploaded yet.</div>
            </div>
          ) : (
            docs.map(doc => {
              const isBusy = busyId === doc.id;
              const isActive = selectedDocumentId === doc.id;
              return (
                <div key={doc.id} className={`doc-manager-row${isActive ? ' active' : ''}`}>
                  <div className="doc-manager-info">
                    <FileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="doc-manager-title" title={doc.title}>{doc.title}</div>
                      <div className="doc-manager-meta">
                        {doc.file_type} • {doc.page_count} pages • {formatSize(doc.file_size)} • {doc.subject}
                        {isActive && <span className="badge badge-primary" style={{ marginLeft: '6px', fontSize: '0.68rem' }}>Active</span>}
                      </div>
                    </div>
                  </div>

                  <div className="doc-manager-actions">
                    {isBusy ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                        {busyLabel}
                      </span>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => startReplace(doc)}
                          disabled={!!busyId}
                          title="Upload a new file in place of this one"
                        >
                          <RefreshCw size={14} />
                          <span>Replace</span>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(doc)}
                          disabled={!!busyId}
                          style={{ color: 'var(--accent-rose)' }}
                          title="Delete this document"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={!!busyId}
            onClick={() => {
              close();
              setActiveTab('upload');
            }}
          >
            <UploadCloud size={16} />
            <span>Upload New Document</span>
          </button>
        </div>
      </div>
    </div>
  );
};

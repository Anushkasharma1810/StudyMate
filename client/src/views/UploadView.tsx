import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
  FolderCog
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

export const UploadView: React.FC = () => {
  const { setActiveTab, setSelectedDocumentId, setDocManagerOpen } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('General');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Only suggestions — users can type any subject, course, exam or skill
  const subjects = [
    'General',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering',
    'Medicine / Nursing', 'Accountancy', 'Business Studies', 'Economics', 'Finance', 'Marketing',
    'History', 'Geography', 'Political Science', 'Sociology', 'Psychology', 'Philosophy',
    'English Literature', 'Hindi', 'Languages', 'Law', 'Arts & Design', 'Music',
    'Competitive Exams (UPSC / SSC / Banking)', 'JEE / NEET', 'Professional Skills', 'Other'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    setError(null);
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT document.');
      return;
    }
    if (f.size > 30 * 1024 * 1024) {
      setError('File is too large. Maximum supported size is 30MB.');
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject.trim() || 'General');

    try {
      const res = await api.uploadDocument(formData);
      setSuccessDoc(res.document);
      setSelectedDocumentId(res.document.id);
    } catch (err: any) {
      setError(err.message || 'Upload failed. The document could not be processed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 24px 60px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            Upload Study Material
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Upload textbooks, lecture notes, question papers, or articles. StudyMate will extract, index, and organize every page for AI processing.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => setDocManagerOpen(true)}>
          <FolderCog size={16} />
          <span>Manage Uploaded Documents</span>
        </button>
      </div>

      {/* Success Banner if uploaded */}
      {successDoc ? (
        <div
          className="card"
          style={{
            borderColor: 'var(--accent-green)',
            background: 'rgba(16, 185, 129, 0.05)',
            padding: '28px',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Document Successfully Processed!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {successDoc.title} • {successDoc.pageCount} Pages • {successDoc.wordCount} Words • {successDoc.subject}
              </p>
            </div>
          </div>

          {successDoc.summary && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                marginBottom: '20px',
                lineHeight: 1.6
              }}
            >
              <strong>Summary Preview:</strong> {successDoc.summary}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('notes')}
              className="btn btn-primary"
            >
              <FileText size={16} />
              <span>Generate AI Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="btn btn-secondary"
            >
              <Sparkles size={16} />
              <span>Ask Document Tutor</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="btn btn-secondary"
            >
              <GraduationCap size={16} />
              <span>Generate Quiz</span>
            </button>
            <button
              onClick={() => {
                setSuccessDoc(null);
                setFile(null);
              }}
              className="btn btn-ghost"
            >
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <div>
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--bg-card)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '24px'
            }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <UploadCloud size={30} />
            </div>

            {file ? (
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for parsing
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                  Click to choose a file or drag and drop here
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Supports PDF, DOCX, TXT, and Markdown (up to 30MB)
                </p>
              </div>
            )}
          </div>

          {/* Subject Selector & Upload Action */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                  Organize by Subject / Course
                </label>
                {/* Free text: type any subject/course, or pick a suggestion */}
                <input
                  type="text"
                  list="subject-suggestions"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onBlur={() => !subject.trim() && setSubject('General')}
                  className="input"
                  placeholder="Type any subject or course (e.g. Accountancy, NEET Biology)"
                  maxLength={60}
                />
                <datalist id="subject-suggestions">
                  {subjects.map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn btn-primary"
                  style={{ width: '100%', opacity: !file || uploading ? 0.6 : 1 }}
                >
                  {uploading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      <span>Extracting & Indexing Pages...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>Upload & Process Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                marginBottom: '28px'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

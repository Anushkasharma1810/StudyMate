import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  BrainCircuit,
  Columns,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { DocumentItem } from '../types.js';

export const ToolsView: React.FC = () => {
  const { selectedDocumentId, setSelectedDocumentId } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeTool, setActiveTool] = useState<'explainer' | 'mindmap' | 'compare' | 'questions'>('explainer');

  // Concept Explainer state
  const [concept, setConcept] = useState('Heisenberg Uncertainty Principle');
  const [explainLevel, setExplainLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [explainOutput, setExplainOutput] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  // Mind Map state
  const [mindMapData, setMindMapData] = useState<any | null>(null);
  const [generatingMindMap, setGeneratingMindMap] = useState(false);

  // Compare & Simplify state
  const [compareMode, setCompareMode] = useState<'compare' | 'simplify'>('compare');
  const [conceptA, setConceptA] = useState('Process');
  const [conceptB, setConceptB] = useState('Thread');
  const [textToSimplify, setTextToSimplify] = useState('Quantum tunneling describes a quantum mechanical phenomenon where a wave function can propagate through a potential barrier higher than the particle\'s mechanical energy.');
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  // Important Questions state
  const [questionsOutput, setQuestionsOutput] = useState<string | null>(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getDocuments().then(res => setDocuments(res.documents || [])).catch(() => {});
  }, []);

  const handleExplain = async () => {
    if (!concept.trim()) return;
    setExplaining(true);
    try {
      const res = await api.explainConcept({
        concept,
        level: explainLevel,
        documentId: selectedDocumentId
      });
      setExplainOutput(res.explanation);
    } catch (err: any) {
      alert(err.message || 'Failed to explain concept');
    } finally {
      setExplaining(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!selectedDocumentId) {
      alert('Please select or upload a document first!');
      return;
    }
    setGeneratingMindMap(true);
    try {
      const res = await api.generateMindMap(selectedDocumentId);
      setMindMapData(res.tree);
    } catch (err: any) {
      alert(err.message || 'Failed to generate mind map');
    } finally {
      setGeneratingMindMap(false);
    }
  };

  const handleCompareSimplify = async () => {
    setComparing(true);
    try {
      const res = await api.compareSimplify({
        mode: compareMode,
        conceptA,
        conceptB,
        text: textToSimplify
      });
      setCompareResult(res.result);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setComparing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedDocumentId) {
      alert('Please select or upload a document first!');
      return;
    }
    setGeneratingQuestions(true);
    try {
      const res = await api.getImportantQuestions(selectedDocumentId);
      setQuestionsOutput(res.questions);
    } catch (err: any) {
      alert(err.message || 'Failed to generate exam questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 28px 60px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          Additional AI Learning Tools
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Powerful conceptual synthesizers, mind map visualizations, and exam preparation assistants.
        </p>
      </div>

      {/* Tool Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTool('explainer')}
          className={`btn ${activeTool === 'explainer' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Sparkles size={15} />
          <span>Concept Explainer</span>
        </button>

        <button
          onClick={() => setActiveTool('mindmap')}
          className={`btn ${activeTool === 'mindmap' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <BrainCircuit size={15} />
          <span>Interactive Mind Map</span>
        </button>

        <button
          onClick={() => setActiveTool('compare')}
          className={`btn ${activeTool === 'compare' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <Columns size={15} />
          <span>Compare & Simplify</span>
        </button>

        <button
          onClick={() => setActiveTool('questions')}
          className={`btn ${activeTool === 'questions' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          <HelpCircle size={15} />
          <span>Important Exam Questions</span>
        </button>
      </div>

      {/* TOOL 1: CONCEPT EXPLAINER */}
      {activeTool === 'explainer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
              Multi-Level Concept Breakdown
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Concept or Topic
              </label>
              <input
                type="text"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                className="input"
                placeholder="e.g. Wave-Particle Duality"
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Explanation Level
              </label>
              <select
                value={explainLevel}
                onChange={e => setExplainLevel(e.target.value as any)}
                className="select"
              >
                <option value="beginner">Beginner (Everyday Analogies & Plain English)</option>
                <option value="intermediate">Intermediate (College Academic Rigor)</option>
                <option value="advanced">Advanced (Mathematical Proofs & Edge Cases)</option>
              </select>
            </div>

            <button
              onClick={handleExplain}
              disabled={explaining || !concept.trim()}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {explaining ? 'Synthesizing Explanation...' : 'Explain Concept'}
            </button>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Tutor Explanation</h3>
              {explainOutput && (
                <button onClick={() => handleCopy(explainOutput)} className="btn btn-ghost btn-sm">
                  {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div
              className="markdown-body"
              style={{
                minHeight: '260px',
                background: 'var(--bg-subtle)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem'
              }}
            >
              {explainOutput || 'Enter a concept on the left and click "Explain Concept" to generate multi-level analogies, mechanisms, and practice checks.'}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: INTERACTIVE MIND MAP */}
      {activeTool === 'mindmap' && (
        <div>
          <div className="card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color="var(--primary)" />
              <select
                value={selectedDocumentId || ''}
                onChange={e => setSelectedDocumentId(e.target.value)}
                className="select"
                style={{ maxWidth: '300px' }}
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateMindMap}
              disabled={generatingMindMap || !selectedDocumentId}
              className="btn btn-primary"
            >
              {generatingMindMap ? 'Building Concept Tree...' : 'Generate Mind Map'}
            </button>
          </div>

          {mindMapData ? (
            <div className="card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', textAlign: 'center' }}>
                🧠 Concept Hierarchy: {mindMapData.label}
              </h3>

              {/* Visual Node Tree */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                {/* Root node */}
                <div
                  style={{
                    padding: '14px 28px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    boxShadow: '0 6px 18px var(--primary-ring)'
                  }}
                >
                  {mindMapData.label}
                </div>

                {/* Branches */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  {mindMapData.children?.map((branch: any, idx: number) => (
                    <div
                      key={branch.id || idx}
                      className="card"
                      style={{
                        flex: '1 1 240px',
                        maxWidth: '320px',
                        padding: '18px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderTop: '4px solid var(--primary)'
                      }}
                    >
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
                        {branch.label}
                      </h4>

                      {branch.children && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {branch.children.map((sub: any, subIdx: number) => (
                            <div
                              key={sub.id || subIdx}
                              style={{
                                padding: '8px 12px',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.82rem',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              • {sub.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-soft)' }}>
              <BrainCircuit size={48} style={{ margin: '0 auto 14px', color: 'var(--primary)', opacity: 0.5 }} />
              <p style={{ fontSize: '0.92rem' }}>
                Select an uploaded document above and click "Generate Mind Map" to extract a visual concept tree.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: COMPARE & SIMPLIFY */}
      {activeTool === 'compare' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setCompareMode('compare')}
                className={`btn ${compareMode === 'compare' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                Compare Two Concepts
              </button>
              <button
                onClick={() => setCompareMode('simplify')}
                className={`btn ${compareMode === 'simplify' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                Simplify Dense Text
              </button>
            </div>

            {compareMode === 'compare' ? (
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Concept A
                  </label>
                  <input
                    type="text"
                    value={conceptA}
                    onChange={e => setConceptA(e.target.value)}
                    className="input"
                    placeholder="e.g. TCP"
                  />
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Concept B
                  </label>
                  <input
                    type="text"
                    value={conceptB}
                    onChange={e => setConceptB(e.target.value)}
                    className="input"
                    placeholder="e.g. UDP"
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Paste Complex Academic Text to Simplify
                </label>
                <textarea
                  value={textToSimplify}
                  onChange={e => setTextToSimplify(e.target.value)}
                  className="textarea"
                  style={{ minHeight: '120px' }}
                />
              </div>
            )}

            <button
              onClick={handleCompareSimplify}
              disabled={comparing}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {comparing ? 'Processing...' : compareMode === 'compare' ? 'Generate Comparison Table' : 'Simplify with Analogy'}
            </button>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Synthesis Result</h3>
            <div
              className="markdown-body"
              style={{
                minHeight: '260px',
                background: 'var(--bg-subtle)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem'
              }}
            >
              {compareResult || 'Output will appear here once processed.'}
            </div>
          </div>
        </div>
      )}

      {/* TOOL 4: IMPORTANT EXAM QUESTIONS */}
      {activeTool === 'questions' && (
        <div>
          <div className="card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} color="var(--primary)" />
              <select
                value={selectedDocumentId || ''}
                onChange={e => setSelectedDocumentId(e.target.value)}
                className="select"
                style={{ maxWidth: '300px' }}
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateQuestions}
              disabled={generatingQuestions || !selectedDocumentId}
              className="btn btn-primary"
            >
              {generatingQuestions ? 'Generating Questions...' : 'Generate Exam Questions'}
            </button>
          </div>

          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                High-Yield Practice & Viva Questions
              </h3>
              {questionsOutput && (
                <button onClick={() => handleCopy(questionsOutput)} className="btn btn-ghost btn-sm">
                  {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div
              className="markdown-body"
              style={{
                minHeight: '300px',
                background: 'var(--bg-subtle)',
                padding: '20px 24px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.92rem'
              }}
            >
              {questionsOutput || 'Select an uploaded document above to generate short answer questions, long descriptive questions, and oral viva questions with model answers.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

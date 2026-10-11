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
  GraduationCap
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

export const UploadView: React.FC = () => {
  const { setActiveTab, setSelectedDocumentId } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('General');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDoc, setSuccessDoc] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const subjects = ['General', 'Computer Science', 'Physics', 'Mathematics', 'Biology', 'Chemistry', 'History', 'Economics', 'Law'];

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
    formData.append('subject', subject);

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

  // One-click Sample Material uploader for instant testing
  const handleUploadSample = async (sampleType: 'physics' | 'cs') => {
    setUploading(true);
    setError(null);

    let content = '';
    let name = '';
    let sub = '';

    if (sampleType === 'physics') {
      name = 'Quantum_Mechanics_Fundamentals.txt';
      sub = 'Physics';
      content = `# Introduction to Quantum Mechanics and Wave Mechanics

## Chapter 1: The Foundations of Quantum Theory
Classical physics assumed that light consists strictly of continuous electromagnetic waves, while matter consists of discrete localized particles. However, groundbreaking experiments in the early 20th century shattered this separation. Max Planck observed that black-body radiation could only be explained if electromagnetic energy is emitted and absorbed in discrete packets called quanta. The energy of a quantum is given by E = hν, where h is Planck's constant (6.626 x 10^-34 J·s) and ν is the frequency.

In 1905, Albert Einstein extended this concept to explain the photoelectric effect, demonstrating that light behaves as localized packets of energy called photons. When light strikes a metallic surface, electrons are ejected only if the incident photon frequency exceeds a threshold frequency, regardless of the light intensity.

## Chapter 2: Wave-Particle Duality and De Broglie Hypothesis
In 1924, Louis de Broglie hypothesized that if light waves possess particle-like characteristics, then particles of matter such as electrons must also exhibit wave-like properties. The wavelength associated with any moving matter is given by λ = h / p, where p = mv is the relativistic momentum.

This hypothesis was confirmed experimentally by Davisson and Germer in 1927, who observed diffraction patterns when an electron beam was scattered by a nickel crystal. Diffraction is exclusively a wave phenomenon, proving unequivocally that moving matter possesses an intrinsic wave nature.

## Chapter 3: The Heisenberg Uncertainty Principle
Werner Heisenberg formulated the fundamental mathematical limit of simultaneous measurements in quantum systems. The Heisenberg Uncertainty Principle states that it is physically impossible to simultaneously determine both the exact position (x) and the exact momentum (p) of a subatomic particle with arbitrary precision.
Mathematically: Δx · Δp ≥ ℏ / 2, where ℏ = h / 2π.
A related relation holds for energy and time: ΔE · Δt ≥ ℏ / 2.
This principle is not an artifact of imperfect measurement tools; it is an inherent property of wave-particle systems.

## Chapter 4: The Schrödinger Wave Equation
Erwin Schrödinger introduced the fundamental equation governing the behavior of non-relativistic quantum systems. The state of a quantum particle is described completely by a wave function, denoted as Ψ(x, t).
The time-dependent Schrödinger equation is given by:
iℏ ∂Ψ/∂t = ĤΨ, where Ĥ is the Hamiltonian operator.
Max Born provided the physical interpretation: the absolute square of the wave function |Ψ(x,t)|² represents the probability density of finding the particle at position x at time t.

## Chapter 5: Quantum Tunneling and Real-World Applications
Quantum tunneling is a quantum mechanical phenomenon where a particle penetrates through a potential energy barrier higher than its kinetic energy. In classical mechanics, a particle lacking sufficient energy is reflected with 100% certainty. In quantum mechanics, because the wave function does not instantly drop to zero inside the barrier, there is an exponential decay and a non-zero probability of the particle appearing on the opposite side.
Applications of quantum tunneling include:
1. Alpha decay in radioactive atomic nuclei.
2. Nuclear fusion in the sun powering stellar energy.
3. Flash memory and tunnel diodes in modern microchips.
4. Scanning Tunneling Microscopy (STM) allowing visualization of individual atoms.`;
    } else {
      name = 'Operating_Systems_Concurrency.txt';
      sub = 'Computer Science';
      content = `# Operating Systems: Processes, Concurrency, and Memory Management

## Chapter 1: Processes and Process Control Blocks (PCB)
An operating system process is an executing program including the program counter, CPU registers, stack, and heap. The kernel represents each process through a Process Control Block (PCB). The PCB tracks the process state: New, Ready, Running, Waiting, and Terminated.
When the CPU switches between processes, the system performs a Context Switch. Context switching incurs computational overhead as the operating system saves register values to the PCB and restores the next process's state.

## Chapter 2: Threads and Multithreading
A thread is the fundamental unit of CPU utilization. It comprises a thread ID, program counter, register set, and a stack. Multiple threads within the same process share code, data sections, and operating system resources such as open files.
Benefits of multithreading include responsiveness, resource sharing, economy over process creation, and scalability across multi-core processors.

## Chapter 3: The Critical Section Problem and Synchronization
When multiple concurrent threads access shared data, race conditions occur if the outcome depends on the execution order. The critical section problem requires three essential properties:
1. Mutual Exclusion: If process P is executing in its critical section, no other processes can execute in their critical sections.
2. Progress: If no process is executing in its critical section and some processes wish to enter, only those processes not executing in their remainder sections can participate in deciding who enters next.
3. Bounded Waiting: A bound must exist on the number of times other processes are allowed to enter their critical sections after a process has requested entry.
Mechanisms to solve synchronization include Mutex Locks, Semaphores (Counting and Binary), and Monitors.

## Chapter 4: Deadlocks and Conditions
A deadlock occurs when a set of blocked processes each holds a resource and waits to acquire a resource held by another process in the set. Four Coffman conditions must hold simultaneously for a deadlock:
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait
Deadlock handling strategies include Prevention, Avoidance (e.g. Dijkstra's Banker's Algorithm), and Detection & Recovery.

## Chapter 5: Virtual Memory and Paging
Virtual memory separates user logical memory from physical memory. Paging eliminates external fragmentation by dividing physical memory into fixed-size frames and logical memory into pages of the identical size.
A Translation Lookaside Buffer (TLB) acts as a high-speed hardware cache for page table lookups. Page fault occurs when a process attempts to access a page marked invalid in the page table, triggering the OS to fetch the page from secondary storage.`;
    }

    const sampleBlob = new Blob([content], { type: 'text/plain' });
    const sampleFile = new File([sampleBlob], name, { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', sampleFile);
    formData.append('subject', sub);

    try {
      const res = await api.uploadDocument(formData);
      setSuccessDoc(res.document);
      setSelectedDocumentId(res.document.id);
    } catch (err: any) {
      setError(err.message || 'Sample upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 24px 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
          Upload Study Material
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Upload textbooks, lecture notes, question papers, or articles. StudyMate will extract, index, and organize every page for AI processing.
        </p>
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
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="select"
                >
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
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

          {/* One-click Sample Materials */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={16} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Don't have a document ready? Test with curated study samples:
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div
                onClick={() => handleUploadSample('physics')}
                className="card"
                style={{
                  padding: '16px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    ⚛️ Quantum Mechanics Fundamentals
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Wave-particle duality, Heisenberg, Schrödinger equation
                  </div>
                </div>
                <ArrowRight size={16} color="var(--primary)" />
              </div>

              <div
                onClick={() => handleUploadSample('cs')}
                className="card"
                style={{
                  padding: '16px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    💻 Operating Systems & Concurrency
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Processes, threads, critical sections, deadlock conditions
                  </div>
                </div>
                <ArrowRight size={16} color="var(--primary)" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

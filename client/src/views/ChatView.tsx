import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquareText,
  Send,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Plus,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { ChatMessage, ChatSession, DocumentItem } from '../types.js';
import { FormattedMarkdown } from '../components/FormattedMarkdown.js';

export const ChatView: React.FC = () => {
  const { selectedDocumentId, setSelectedDocumentId, setActiveTab } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, [selectedDocumentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = async () => {
    try {
      const docsRes = await api.getDocuments();
      setDocuments(docsRes.documents || []);

      if (docsRes.documents?.length > 0) {
        const activeDocId = selectedDocumentId || docsRes.documents[0].id;
        if (!selectedDocumentId) setSelectedDocumentId(activeDocId);

        // Load this document's chat history; open the most recent chat
        const sessRes = await api.getChatSessions(activeDocId);
        const list: ChatSession[] = sessRes.sessions || [];
        setSessions(list);
        if (list.length > 0) {
          await openSession(list[0]);
        } else {
          // Nothing yet → start in a blank "new chat" (created lazily on first message)
          setSession(null);
          setMessages([]);
        }
      } else {
        setSessions([]);
        setSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openSession = async (s: ChatSession) => {
    setSession(s);
    setMessages([]);
    try {
      const msgRes = await api.getChatMessages(s.id);
      setMessages(msgRes.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Like ChatGPT's "New chat": old chats stay in history, a blank chat opens
  const handleNewChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setSession(null);
    setMessages([]);
    setInputText('');
  };

  const handleDeleteSession = async (s: ChatSession) => {
    if (!confirm(`Delete chat "${s.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteChatSession(s.id);
      setSessions(prev => prev.filter(x => x.id !== s.id));
      if (session?.id === s.id) handleNewChat();
    } catch (err: any) {
      alert(err.message || 'Failed to delete chat');
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !selectedDocumentId) return;

    // Create the chat session on the first message of a new chat
    let activeSession = session;
    if (!activeSession) {
      try {
        const created = await api.createChatSession({ documentId: selectedDocumentId, title: 'New Chat' });
        activeSession = created.session as ChatSession;
        setSession(activeSession);
      } catch (err: any) {
        alert(err.message || 'Failed to start a new chat');
        return;
      }
    }
    const currentSession = activeSession as ChatSession;

    const userTempMsg: ChatMessage = {
      id: 'temp_u_' + Date.now(),
      role: 'user',
      content: textToSend.trim()
    };

    setMessages(prev => [...prev, userTempMsg]);
    if (!customText) setInputText('');
    setSending(true);

    try {
      const res = await api.sendChatMessage(currentSession.id, textToSend.trim(), language);
      setMessages(prev => [...prev.filter(m => m.id !== userTempMsg.id), res.userMessage, res.assistantMessage]);

      // Move this chat to the top of the history with its (possibly new) title
      const updated: ChatSession = {
        ...currentSession,
        title: res.sessionTitle || currentSession.title,
        updated_at: new Date().toISOString()
      };
      setSession(updated);
      setSessions(prev => [updated, ...prev.filter(x => x.id !== updated.id)]);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotes = async (content: string) => {
    if (!selectedDocumentId) return;
    try {
      await api.generateNotes({
        documentId: selectedDocumentId,
        noteType: 'summary',
        length: 'short',
        language,
        learningLevel: 'college'
      });
      alert('Answer appended to your saved notes!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Text-to-speech voice tutor reading
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\[Page \d+\]/g, ''));
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Microphone dictation
  const handleToggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.onstart = () => setListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? prev + ' ' + transcript : transcript));
        setListening(false);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const promptSuggestions = [
    'Explain the core concept step-by-step with an analogy',
    'What are the most important points I must remember for my exam?',
    'Give a real-life example of the main idea in this document',
    'Summarize the primary differences in a comparative table'
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Document Selector & Language Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={18} color="var(--primary)" />
          <select
            value={selectedDocumentId || ''}
            onChange={e => setSelectedDocumentId(e.target.value)}
            className="select"
            style={{ fontWeight: 600, minWidth: '240px' }}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: 600 }}>Tutor Language:</span>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value as any)}
            className="select"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </div>

      <div className="chat-layout">
      {/* Chat history (like ChatGPT's sidebar) */}
      <aside className="chat-history card">
        <button
          onClick={handleNewChat}
          className="btn btn-primary btn-sm chat-new-btn"
          disabled={!selectedDocumentId}
        >
          <Plus size={15} />
          <span>New Chat</span>
        </button>
        <div className="chat-history-label">Previous chats</div>
        <div className="chat-history-list">
          {sessions.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', padding: '6px 4px' }}>
              No chats yet. Ask your first question!
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className={`chat-history-item${session?.id === s.id ? ' active' : ''}`}
                onClick={() => session?.id !== s.id && openSession(s)}
                title={s.title}
              >
                <MessageCircle size={14} style={{ flexShrink: 0 }} />
                <span className="chat-history-title">{s.title}</span>
                <button
                  className="chat-history-delete"
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteSession(s);
                  }}
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="chat-main">
      {/* Messages Thread Container */}
      <div
        className="card"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '16px',
          background: 'var(--bg-card)'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', maxWidth: '580px', padding: '30px 10px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <MessageSquareText size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Ask Any Question About Your Document
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              StudyMate grounds every answer strictly in the text of your uploaded material and cites exact page numbers so you can verify facts directly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)' }}>Suggested questions to get started:</span>
              {promptSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(s)}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <span>{s}</span>
                  <ArrowRight size={14} color="var(--primary)" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(m => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    background: isUser ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: isUser ? '#FFFFFF' : 'var(--text-main)',
                    boxShadow: 'var(--shadow-sm)',
                    border: isUser ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {isUser ? (
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {m.content}
                    </div>
                  ) : (
                    <FormattedMarkdown content={m.content} />
                  )}

                  {/* Grounded Source Citations */}
                  {m.sourcePages && m.sourcePages.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-soft)' }}>
                        Verified Sources:
                      </span>
                      {m.sourcePages.map(p => (
                        <span key={p} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                          Page {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assistant Message Action Toolbar */}
                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', marginLeft: '6px' }}>
                    <button
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                    >
                      {copiedId === m.id ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleSpeak(m.id, m.content)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: speakingId === m.id ? 'var(--primary)' : 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      title="Read aloud with Voice Tutor"
                    >
                      {speakingId === m.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      <span>{speakingId === m.id ? 'Stop Voice' : 'Listen'}</span>
                    </button>

                    <button
                      onClick={() => handleSaveToNotes(m.content)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      title="Save answer to notes"
                    >
                      <BookmarkPlus size={13} />
                      <span>Save to Notes</span>
                    </button>
                  </div>
                )}

                {/* Suggested follow-up pills */}
                {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', maxWidth: '85%' }}>
                    {m.suggestedQuestions.map((sq, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sq)}
                        className="badge badge-subtle"
                        style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem', background: 'var(--bg-card)', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                      >
                        <Sparkles size={11} color="var(--primary)" />
                        <span>{sq}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={handleToggleMic}
          className={`btn ${listening ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: '44px', height: '44px', padding: 0, borderRadius: 'var(--radius-md)' }}
          title={listening ? 'Listening... click to stop' : 'Speech input (Voice Tutor)'}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask a question about this document (e.g. explain step-by-step or give an analogy)..."
          className="input"
          style={{ height: '44px', fontSize: '0.92rem' }}
          disabled={sending || !selectedDocumentId}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={sending || !inputText.trim() || !selectedDocumentId}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 20px' }}
        >
          {sending ? (
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #FFFFFF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <span>Ask</span>
              <Send size={15} />
            </>
          )}
        </button>
      </div>
      </div>
      </div>
    </div>
  );
};

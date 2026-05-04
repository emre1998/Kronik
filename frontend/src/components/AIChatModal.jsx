import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { aiChat } from '../api';

const WELCOME = 'Merhaba! 👋 Ben Kronik AI. Sana bir cron job oluşturmana yardım edeceğim.\n\nNe yapmak istiyorsun? Örneğin: "Her gün sabah 9\'da şu API\'ye GET isteği at" şeklinde anlat.';

const NOTIFY_LABELS = { always: 'Her zaman', error: 'Sadece hata', never: 'Hiç' };

export default function AIChatModal({ onClose, onCreateJob }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);
  const [createError, setCreateError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, pendingJob]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setPendingJob(null);
    setCreateError('');

    try {
      // Filter out the local welcome message before sending to API
      const apiMessages = nextMessages.filter(
        m => !(m.role === 'assistant' && m.content === WELCOME)
      );
      const res = await aiChat(apiMessages);
      const { content, jobReady, jobData } = res.data;

      setMessages(prev => [...prev, { role: 'assistant', content }]);
      if (jobReady && jobData) setPendingJob(jobData);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Bir hata oluştu. Lütfen tekrar dene.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleCreate = async () => {
    if (!pendingJob || creating) return;
    setCreating(true);
    setCreateError('');
    try {
      await onCreateJob(pendingJob);
      // Show success then close
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '✅ Job başarıyla oluşturuldu! Artık dashboard\'da görünüyor.' },
      ]);
      setPendingJob(null);
      setTimeout(onClose, 1800);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Job oluşturulamadı. Lütfen tekrar dene.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="ai-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ai-modal">
        {/* Header */}
        <div className="ai-modal-head">
          <div className="ai-avatar">
            <Sparkles size={15} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>
              Kronik AI
            </div>
            <div style={{ fontSize: 10, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Çevrimiçi · llama-3.1-8b
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--t3)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-modal-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              {msg.content.split('\n').map((line, j, arr) => (
                <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
              ))}
            </div>
          ))}

          {loading && (
            <div className="ai-typing">
              <span /><span /><span />
            </div>
          )}

          {pendingJob && !loading && (
            <div className="ai-job-preview">
              <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✅ Job Hazır
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                {[
                  ['Ad', pendingJob.name, false],
                  ['URL', pendingJob.url, true],
                  ['Method', pendingJob.method, false],
                  ['Schedule', pendingJob.cron_expression, true],
                  ['Bildirim', NOTIFY_LABELS[pendingJob.notify_on] || 'Her zaman', false],
                ].map(([k, v, mono]) => (
                  <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--t3)', width: 60, flexShrink: 0, fontSize: 11 }}>{k}:</span>
                    <span style={{
                      color: 'var(--t1)',
                      fontFamily: mono ? 'var(--mono)' : 'inherit',
                      fontSize: mono ? 11 : 12,
                      wordBreak: 'break-all',
                    }}>{v}</span>
                  </div>
                ))}
              </div>

              {createError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, marginBottom: 8, fontSize: 12, color: 'var(--error)' }}>
                  <AlertCircle size={13} /> {createError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '9px',
                  background: creating ? 'rgba(16,185,129,0.5)' : 'var(--success)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'var(--body)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                {creating
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Oluşturuluyor…</>
                  : <><CheckCircle size={14} /> Job'u Oluştur</>
                }
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="ai-modal-input">
          <textarea
            ref={inputRef}
            className="ai-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Mesajınızı yazın… (Enter gönder, Shift+Enter satır)"
            rows={1}
            disabled={loading}
          />
          <button className="ai-send" onClick={send} disabled={!input.trim() || loading}>
            <Send size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

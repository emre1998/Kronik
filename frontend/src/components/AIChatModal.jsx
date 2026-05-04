import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, CheckCircle, Bot } from 'lucide-react';
import { aiChat } from '../api';

const WELCOME = 'Merhaba! 👋 Ben Kronik AI. Sana bir cron job oluşturmana yardım edeceğim.\n\nNe yapmak istiyorsun? Örneğin: "Her gün sabah 9\'da şu API\'ye istek at" şeklinde açıklayabilirsin.';

export default function AIChatModal({ onClose, onCreateJob }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setPendingJob(null);

    try {
      // Only send the actual conversation (skip the welcome message since it's local)
      const apiMessages = nextMessages.filter(m => !(m.role === 'assistant' && m.content === WELCOME));
      const res = await aiChat(apiMessages);
      const { content, jobReady, jobData } = res.data;

      setMessages(prev => [...prev, { role: 'assistant', content }]);

      if (jobReady && jobData) {
        setPendingJob(jobData);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Bir hata oluştu. Lütfen tekrar dene.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleCreate = () => {
    if (!pendingJob) return;
    onCreateJob(pendingJob);
    onClose();
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
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--t3)', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-modal-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              {msg.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['Ad', pendingJob.name],
                  ['URL', pendingJob.url],
                  ['Method', pendingJob.method],
                  ['Schedule', pendingJob.cron_expression],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--t3)', width: 56, flexShrink: 0 }}>{k}:</span>
                    <span style={{ color: 'var(--t1)', fontFamily: k === 'URL' || k === 'Schedule' ? 'var(--mono)' : 'inherit', fontSize: k === 'URL' ? 11 : 12, wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreate}
                style={{ marginTop: 12, width: '100%', padding: '9px', background: 'var(--success)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
              >
                <CheckCircle size={14} /> Job'u Oluştur
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
            placeholder="Mesajınızı yazın… (Enter ile gönder)"
            rows={1}
            disabled={loading}
          />
          <button
            className="ai-send"
            onClick={send}
            disabled={!input.trim() || loading}
          >
            <Send size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

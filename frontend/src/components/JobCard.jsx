import { useState } from 'react';
import { Play, Trash2, Edit2, Globe, Clock, Loader2 } from 'lucide-react';

const METHOD_CFG = {
  GET:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  POST:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  PUT:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PATCH:  { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  DELETE: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
};

export default function JobCard({ job, onEdit, onDelete, onTrigger, onToggle, onClick }) {
  const [triggering, setTriggering] = useState(false);
  const [hovered, setHovered] = useState(false);
  const m = METHOD_CFG[job.method] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };

  const handleTrigger = async (e) => {
    e.stopPropagation();
    setTriggering(true);
    await onTrigger(job.id);
    setTimeout(() => setTriggering(false), 1200);
  };

  return (
    <div
      style={{
        ...s.card,
        borderColor: hovered ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
        boxShadow: hovered ? '0 0 0 1px rgba(124,58,237,0.15), 0 8px 32px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(job)}
    >
      {/* Gradient top stripe */}
      <div style={{ ...s.stripe, background: job.is_active ? `linear-gradient(90deg, ${m.color}40, transparent)` : 'linear-gradient(90deg, rgba(255,255,255,0.05), transparent)' }} />

      {/* Header */}
      <div style={s.header}>
        <span style={{ ...s.methodBadge, color: m.color, background: m.bg }}>
          {job.method}
        </span>
        <span style={s.name}>{job.name}</span>
        <button
          style={{ ...s.statusBtn, background: job.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${job.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}
          onClick={(e) => { e.stopPropagation(); onToggle(job); }}
          title={job.is_active ? 'Aktif — tıkla pasife al' : 'Pasif — tıkla aktive al'}
        >
          <span style={{ ...s.dot, background: job.is_active ? '#10b981' : '#475569', boxShadow: job.is_active ? '0 0 6px rgba(16,185,129,0.6)' : 'none' }}
            className={job.is_active ? 'pulse-dot' : ''} />
          <span style={{ fontSize: 11, fontWeight: 600, color: job.is_active ? '#10b981' : '#475569' }}>
            {job.is_active ? 'Aktif' : 'Pasif'}
          </span>
        </button>
      </div>

      {/* URL */}
      <div style={s.urlRow}>
        <Globe size={11} color="#475569" style={{ flexShrink: 0 }} />
        <span style={s.url}>{job.url}</span>
      </div>

      {/* Cron */}
      <div style={s.cronRow}>
        <Clock size={11} color="#7c3aed" style={{ flexShrink: 0 }} />
        <span style={s.cron}>{job.cron_expression}</span>
      </div>

      {/* Divider */}
      <div style={s.divider} />

      {/* Actions */}
      <div style={s.actions} onClick={(e) => e.stopPropagation()}>
        <button
          style={{ ...s.actionBtn, background: triggering ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', borderColor: triggering ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)', color: triggering ? '#10b981' : '#94a3b8' }}
          onClick={handleTrigger}
          title="Şimdi çalıştır"
        >
          {triggering
            ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
            : <Play size={13} />}
          <span style={{ fontSize: 12, fontWeight: 500 }}>Çalıştır</span>
        </button>

        <button style={{ ...s.actionBtn, marginLeft: 'auto' }} onClick={() => onEdit(job)} title="Düzenle">
          <Edit2 size={13} />
        </button>
        <button style={{ ...s.actionBtn, background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.15)', color: '#f43f5e' }} onClick={() => onDelete(job.id)} title="Sil">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

const s = {
  card: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' },
  stripe: { height: 3, width: '100%' },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 0', minWidth: 0 },
  methodBadge: { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--mono)', letterSpacing: '0.05em', flexShrink: 0 },
  name: { flex: 1, fontWeight: 700, fontSize: 14.5, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statusBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 },
  dot: { width: 6, height: 6, borderRadius: '50%', transition: 'all 0.3s' },
  urlRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px' },
  url: { fontSize: 11.5, color: '#475569', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cronRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px' },
  cron: { fontSize: 12, color: '#a78bfa', fontFamily: 'var(--mono)', fontWeight: 500 },
  divider: { height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' },
  actions: { display: 'flex', gap: 6, padding: '0 16px 14px', alignItems: 'center' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s' },
};

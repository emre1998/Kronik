import { useState } from 'react';
import { Play, Trash2, Edit2, Globe, Clock, Loader2, Zap } from 'lucide-react';

const METHOD_CFG = {
  GET:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  POST:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  PUT:    { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  PATCH:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

export default function JobCard({ job, onEdit, onDelete, onTrigger, onToggle, onClick }) {
  const [triggering, setTriggering] = useState(false);
  const [hovered, setHovered] = useState(false);
  const m = METHOD_CFG[job.method] || { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };

  const handleTrigger = async (e) => {
    e.stopPropagation();
    setTriggering(true);
    await onTrigger(job.id);
    setTimeout(() => setTriggering(false), 1400);
  };

  return (
    <div
      style={{
        ...s.card,
        borderColor: hovered ? 'rgba(99,102,241,0.35)' : job.is_active ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.05)',
        boxShadow: hovered ? '0 0 0 1px rgba(99,102,241,0.18), 0 8px 28px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(job)}
    >
      {/* Top accent line */}
      <div style={{ height: 2, background: job.is_active ? `linear-gradient(90deg, ${m.color}80, transparent)` : 'transparent', borderRadius: '12px 12px 0 0', marginTop: -1, marginLeft: -1, marginRight: -1, width: 'calc(100% + 2px)' }} />

      {/* Header */}
      <div style={s.header}>
        <span style={{ ...s.method, color: m.color, background: m.bg }}>{job.method}</span>
        <span style={s.name}>{job.name}</span>
        <button
          style={{ ...s.statusPill, background: job.is_active ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${job.is_active ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.07)'}` }}
          onClick={e => { e.stopPropagation(); onToggle(job); }}
          title={job.is_active ? 'Aktif' : 'Pasif'}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: job.is_active ? '#22d3ee' : '#4b5563', boxShadow: job.is_active ? '0 0 6px rgba(34,211,238,0.7)' : 'none', flexShrink: 0, animation: job.is_active ? 'blink 2.5s ease infinite' : 'none' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: job.is_active ? '#22d3ee' : '#4b5563', letterSpacing: '0.05em' }}>
            {job.is_active ? 'AKTİF' : 'PASİF'}
          </span>
        </button>
      </div>

      {/* URL */}
      <div style={s.urlRow}>
        <Globe size={10} color="#4b5563" style={{ flexShrink: 0 }} />
        <span style={s.url}>{job.url}</span>
      </div>

      {/* Cron */}
      <div style={s.cronRow}>
        <Clock size={10} color="var(--accent2)" style={{ flexShrink: 0 }} />
        <span style={s.cron}>{job.cron_expression}</span>
      </div>

      <div style={s.divider} />

      {/* Actions */}
      <div style={s.actions} onClick={e => e.stopPropagation()}>
        <button
          style={{ ...s.actionBtn, ...(triggering ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)', color: '#4ade80' } : {}) }}
          onClick={handleTrigger} title="Şimdi çalıştır"
        >
          {triggering
            ? <Loader2 size={12} style={{ animation: 'spin 0.7s linear infinite' }} />
            : <Play size={12} />}
          <span style={{ fontSize: 12, fontWeight: 600 }}>Çalıştır</span>
        </button>

        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
          <button style={s.iconActionBtn} onClick={e => { e.stopPropagation(); onEdit(job); }} title="Düzenle">
            <Edit2 size={13} color="#9ca3af" />
          </button>
          <button style={{ ...s.iconActionBtn, background: 'rgba(248,113,113,0.07)', borderColor: 'rgba(248,113,113,0.2)' }} onClick={e => { e.stopPropagation(); onDelete(job.id); }} title="Sil">
            <Trash2 size={13} color="#f87171" />
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  card: { background: 'rgba(255,255,255,0.022)', border: '1px solid', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column', gap: 9 },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px 0', minWidth: 0 },
  method: { fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 5, fontFamily: 'var(--mono)', letterSpacing: '0.06em', flexShrink: 0 },
  name: { flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statusPill: { display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 },
  urlRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px' },
  url: { fontSize: 11, color: '#4b5563', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cronRow: { display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px' },
  cron: { fontSize: 11.5, color: 'var(--accent2)', fontFamily: 'var(--mono)', fontWeight: 500 },
  divider: { height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 14px' },
  actions: { display: 'flex', gap: 6, padding: '0 14px 13px', alignItems: 'center' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#9ca3af', transition: 'all 0.2s' },
  iconActionBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '7px', cursor: 'pointer', transition: 'all 0.2s' },
};

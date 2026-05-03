import { useState } from 'react';
import { Play, Trash2, Edit2, Globe, Clock, Loader2 } from 'lucide-react';

const METHOD = {
  GET:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
  POST:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)' },
  PUT:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)' },
  PATCH:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

export default function JobCard({ job, onEdit, onDelete, onTrigger, onToggle, onClick }) {
  const [triggering, setTriggering] = useState(false);
  const [hovered, setHovered] = useState(false);
  const m = METHOD[job.method] || METHOD.GET;

  const doTrigger = async (e) => {
    e.stopPropagation();
    setTriggering(true);
    await onTrigger(job.id);
    setTimeout(() => setTriggering(false), 1500);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(job)}
      style={{
        background: hovered ? 'var(--card2)' : 'var(--card)',
        border: `1px solid ${hovered ? 'rgba(139,92,246,0.2)' : 'var(--border)'}`,
        borderLeft: `3px solid ${job.is_active ? m.color : 'var(--t4)'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.08)` : '0 2px 8px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 14px 10px' }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5, color:m.color, background:m.bg, border:`1px solid ${m.border}`, letterSpacing:'0.06em', flexShrink:0 }}>
          {job.method}
        </span>
        <span style={{ fontFamily:'var(--head)', fontWeight:700, fontSize:14.5, color:'var(--t1)', flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {job.name}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onToggle(job); }}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, border:`1px solid ${job.is_active ? 'rgba(6,182,212,0.3)' : 'var(--border)'}`, background: job.is_active ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.03)', cursor:'pointer', transition:'all 0.2s', flexShrink:0 }}
        >
          <span style={{ width:6, height:6, borderRadius:'50%', background: job.is_active ? '#06b6d4' : 'var(--t4)', boxShadow: job.is_active ? '0 0 6px rgba(6,182,212,0.8)' : 'none', animation: job.is_active ? 'pulse 2s ease infinite' : 'none' }} />
          <span style={{ fontSize:10, fontWeight:700, color: job.is_active ? '#06b6d4' : 'var(--t3)', letterSpacing:'0.05em' }}>
            {job.is_active ? 'AKTİF' : 'PASİF'}
          </span>
        </button>
      </div>

      {/* URL */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px 8px' }}>
        <Globe size={10} color="var(--t3)" style={{ flexShrink:0 }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--t3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {job.url}
        </span>
      </div>

      {/* Cron */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 14px 12px' }}>
        <Clock size={10} color="var(--accent)" style={{ flexShrink:0 }} />
        <span style={{ fontFamily:'var(--mono)', fontSize:11.5, color:'var(--accent)', fontWeight:500 }}>
          {job.cron_expression}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderTop:'1px solid var(--border)', background:'rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <button
          onClick={doTrigger}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:`1px solid ${triggering ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, background: triggering ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', color: triggering ? 'var(--success)' : 'var(--t2)', cursor:'pointer', transition:'all 0.2s', fontSize:12, fontWeight:600, fontFamily:'var(--body)' }}
        >
          {triggering ? <Loader2 size={12} style={{ animation:'spin 0.7s linear infinite' }} /> : <Play size={12} />}
          Çalıştır
        </button>

        <div style={{ display:'flex', gap:5, marginLeft:'auto' }}>
          <button
            onClick={() => onEdit(job)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)', cursor:'pointer', transition:'all 0.2s' }}
          >
            <Edit2 size={13} color="var(--t2)" />
          </button>
          <button
            onClick={() => onDelete(job.id)}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.06)', cursor:'pointer', transition:'all 0.2s' }}
          >
            <Trash2 size={13} color="var(--error)" />
          </button>
        </div>
      </div>
    </div>
  );
}

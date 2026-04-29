import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { getJobLogs } from '../api';

export default function LogsPanel({ job, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobLogs(job.id).then((r) => { setLogs(r.data); setLoading(false); });
  }, [job.id]);

  const formatDate = (d) => new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const successCount = logs.filter((l) => l.status === 'success').length;
  const rate = logs.length ? Math.round((successCount / logs.length) * 100) : 0;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.panel} className="slide-in">
        <div style={s.glowEdge} />

        <div style={s.header}>
          <div style={s.headerInfo}>
            <div style={s.iconWrap}><Activity size={15} color="#c084fc" /></div>
            <div>
              <div style={s.jobName}>{job.name}</div>
              <div style={s.jobSub}>Çalışma geçmişi</div>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {!loading && logs.length > 0 && (
          <div style={s.summary}>
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Başarı oranı</span>
              <span style={{ ...s.summaryVal, color: rate > 80 ? '#10b981' : '#f59e0b' }}>{rate}%</span>
            </div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${rate}%`, background: rate > 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
            </div>
            <div style={s.summaryMeta}>
              <span style={{ color: '#10b981' }}>{successCount} başarılı</span>
              <span style={{ color: '#475569' }}>·</span>
              <span style={{ color: '#f43f5e' }}>{logs.length - successCount} hatalı</span>
              <span style={{ color: '#475569' }}>·</span>
              <span style={{ color: '#475569' }}>{logs.length} toplam</span>
            </div>
          </div>
        )}

        <div style={s.list}>
          {loading ? (
            <div style={s.center}><div style={s.spinner} /></div>
          ) : logs.length === 0 ? (
            <div style={s.center}>
              <Clock size={28} color="#1e1e2e" />
              <p style={{ color: '#334155', fontSize: 13, marginTop: 10 }}>Henüz çalışma kaydı yok.</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={log.id} style={{ ...s.logItem, borderColor: log.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', animation: `fadeIn 0.2s ease ${i * 0.03}s both` }}>
                <div style={s.logTop}>
                  <div style={s.logStatus}>
                    {log.status === 'success'
                      ? <CheckCircle size={14} color="#10b981" />
                      : <XCircle size={14} color="#f43f5e" />}
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: log.status === 'success' ? '#10b981' : '#f43f5e' }}>
                      {log.status === 'success' ? 'Başarılı' : 'Hata'}
                    </span>
                    {log.status_code && (
                      <span style={{ ...s.codeBadge, background: log.status_code < 400 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: log.status_code < 400 ? '#10b981' : '#f43f5e' }}>
                        {log.status_code}
                      </span>
                    )}
                  </div>
                  <div style={s.logMeta}>
                    <Clock size={10} color="#334155" />
                    <span style={{ fontSize: 11, color: '#334155', fontFamily: 'var(--mono)' }}>{log.duration_ms}ms</span>
                  </div>
                </div>
                <div style={s.logTime}>{formatDate(log.executed_at)}</div>
                {log.response && (
                  <div style={s.logResponse}>{log.response.substring(0, 150)}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 },
  panel: { background: '#0d0d18', border: '1px solid rgba(255,255,255,0.07)', borderRight: 'none', width: '100%', maxWidth: 420, height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '-16px 0 60px rgba(0,0,0,0.5)' },
  glowEdge: { position: 'absolute', top: '10%', bottom: '10%', left: 0, width: 1, background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.5), transparent)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  iconWrap: { width: 34, height: 34, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  jobName: { fontWeight: 700, fontSize: 15, color: '#f8fafc' },
  jobSub: { fontSize: 11.5, color: '#334155', marginTop: 2 },
  closeBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#475569', display: 'flex', padding: 7, borderRadius: 8 },

  summary: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 8 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 11.5, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  summaryVal: { fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)' },
  progressBar: { height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99 },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.6s ease' },
  summaryMeta: { display: 'flex', gap: 8, fontSize: 12, flexWrap: 'wrap' },

  list: { flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 },
  spinner: { width: 24, height: 24, border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  logItem: { background: 'rgba(255,255,255,0.02)', border: '1px solid', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 },
  logTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logStatus: { display: 'flex', alignItems: 'center', gap: 7 },
  codeBadge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, fontFamily: 'var(--mono)' },
  logMeta: { display: 'flex', alignItems: 'center', gap: 4 },
  logTime: { fontSize: 11.5, color: '#334155' },
  logResponse: { fontSize: 11, color: '#334155', fontFamily: 'var(--mono)', wordBreak: 'break-all', lineHeight: 1.5, marginTop: 2 },
};

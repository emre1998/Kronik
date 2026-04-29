import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Activity, Clock, CheckCircle, XCircle, Zap, TrendingUp } from 'lucide-react';
import JobCard from './components/JobCard';
import JobModal from './components/JobModal';
import LogsPanel from './components/LogsPanel';
import { getJobs, createJob, updateJob, deleteJob, triggerJob, getLogs } from './api';

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [tab, setTab] = useState('jobs');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [jobsRes, logsRes] = await Promise.all([getJobs(), getLogs()]);
    setJobs(jobsRes.data);
    setLogs(logsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleSave = async (data) => {
    if (editingJob) await updateJob(editingJob.id, data);
    else await createJob(data);
    setEditingJob(null);
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu job silinecek. Emin misin?')) return;
    await deleteJob(id);
    fetchAll();
  };

  const handleTrigger = async (id) => {
    await triggerJob(id);
    setTimeout(fetchAll, 800);
  };

  const handleToggle = async (job) => {
    await updateJob(job.id, { is_active: !job.is_active });
    fetchAll();
  };

  const activeJobs = jobs.filter((j) => j.is_active).length;
  const successLogs = logs.filter((l) => l.status === 'success').length;
  const errorLogs = logs.filter((l) => l.status === 'error').length;
  const successRate = logs.length ? Math.round((successLogs / logs.length) * 100) : 0;

  const formatDate = (d) => new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div style={s.root}>
      {/* Ambient background */}
      <div style={s.ambient1} />
      <div style={s.ambient2} />

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logoArea}>
          <div style={s.logoMark}>
            <span style={s.logoK}>K</span>
          </div>
          <div>
            <div style={s.logoName}>Kronik</div>
            <div style={s.logoTagline}>cron manager</div>
          </div>
        </div>

        <div style={s.divider} />

        <nav style={s.nav}>
          {[
            { id: 'jobs', icon: <Clock size={15} />, label: 'Jobs', count: jobs.length },
            { id: 'logs', icon: <Activity size={15} />, label: 'Logs', count: logs.length },
          ].map((item) => (
            <button
              key={item.id}
              style={{ ...s.navBtn, ...(tab === item.id ? s.navBtnActive : {}) }}
              onClick={() => setTab(item.id)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span style={s.navLabel}>{item.label}</span>
              <span style={{ ...s.navCount, ...(tab === item.id ? s.navCountActive : {}) }}>
                {item.count}
              </span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.statsCard}>
            <div style={s.statsTitle}>
              <TrendingUp size={13} color="var(--accent3)" />
              Özet
            </div>
            <div style={s.statsRows}>
              <div style={s.statsRow}>
                <div style={s.statDot} />
                <span style={s.statKey}>Aktif</span>
                <span style={s.statNum}>{activeJobs}</span>
              </div>
              <div style={s.statsRow}>
                <div style={{ ...s.statDot, background: 'var(--error)' }} />
                <span style={s.statKey}>Hata</span>
                <span style={{ ...s.statNum, color: errorLogs > 0 ? 'var(--error)' : 'var(--t2)' }}>{errorLogs}</span>
              </div>
              <div style={s.statsRow}>
                <div style={{ ...s.statDot, background: 'var(--warning)' }} />
                <span style={s.statKey}>Başarı %</span>
                <span style={{ ...s.statNum, color: successRate > 80 ? 'var(--success)' : 'var(--warning)' }}>{successRate}%</span>
              </div>
            </div>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${successRate}%` }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <div style={s.breadcrumb}>
              <Zap size={12} color="var(--accent3)" />
              <span style={s.breadcrumbText}>Kronik</span>
              <span style={s.breadcrumbSep}>/</span>
              <span style={s.breadcrumbCurrent}>{tab === 'jobs' ? 'Jobs' : 'Logs'}</span>
            </div>
            <h1 style={s.pageTitle}>
              {tab === 'jobs' ? 'Cron Jobs' : 'Çalışma Logları'}
            </h1>
          </div>
          <div style={s.topActions}>
            <button style={{ ...s.iconBtn, ...(refreshing ? s.iconBtnSpin : {}) }} onClick={handleRefresh} title="Yenile">
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} />
            </button>
            {tab === 'jobs' && (
              <button style={s.newBtn} onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                <Plus size={15} strokeWidth={2.5} />
                Yeni Job
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={s.content}>
          {loading ? (
            <div style={s.centerBox}>
              <div style={s.spinner} />
            </div>
          ) : tab === 'jobs' ? (
            jobs.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}><Clock size={28} color="var(--accent3)" /></div>
                <p style={s.emptyTitle}>Henüz hiç job yok</p>
                <p style={s.emptyDesc}>İlk cron job'unu oluştur ve API'lerini otomatikleştir.</p>
                <button style={s.newBtn} onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                  <Plus size={15} /> İlk job'umu oluştur
                </button>
              </div>
            ) : (
              <div style={s.grid}>
                {jobs.map((job, i) => (
                  <div key={job.id} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                    <JobCard
                      job={job}
                      onEdit={(j) => { setEditingJob(j); setModalOpen(true); }}
                      onDelete={handleDelete}
                      onTrigger={handleTrigger}
                      onToggle={handleToggle}
                      onClick={setSelectedJob}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div style={s.logsWrap}>
              {logs.length === 0 ? (
                <div style={s.centerBox}>
                  <p style={{ color: 'var(--t3)' }}>Henüz log yok.</p>
                </div>
              ) : (
                <div style={s.logsCard}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['', 'Job', 'Durum Kodu', 'Süre', 'Zaman'].map((h) => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} style={s.trow}>
                          <td style={s.td}>
                            {log.status === 'success'
                              ? <CheckCircle size={15} color="var(--success)" />
                              : <XCircle size={15} color="var(--error)" />}
                          </td>
                          <td style={{ ...s.td, color: 'var(--t1)', fontWeight: 500 }}>{log.job_name}</td>
                          <td style={s.td}>
                            {log.status_code ? (
                              <span style={{
                                ...s.codeBadge,
                                background: log.status_code < 400 ? 'var(--success-bg)' : 'var(--error-bg)',
                                color: log.status_code < 400 ? 'var(--success)' : 'var(--error)',
                              }}>
                                {log.status_code}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ ...s.td, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--t3)' }}>
                            {log.duration_ms}ms
                          </td>
                          <td style={{ ...s.td, fontSize: 12, color: 'var(--t3)' }}>
                            {formatDate(log.executed_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <JobModal
          job={editingJob}
          onClose={() => { setModalOpen(false); setEditingJob(null); }}
          onSave={handleSave}
        />
      )}
      {selectedJob && (
        <LogsPanel job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: 'var(--bg-0)', position: 'relative', overflow: 'hidden' },
  ambient1: { position: 'fixed', top: -200, left: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  ambient2: { position: 'fixed', bottom: -200, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },

  sidebar: { width: 230, background: 'rgba(13,13,24,0.9)', backdropFilter: 'blur(20px)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 14px', zIndex: 10, flexShrink: 0 },
  logoArea: { display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 20px' },
  logoMark: { width: 38, height: 38, background: 'linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(124,58,237,0.4)' },
  logoK: { fontWeight: 900, fontSize: 19, color: '#fff', fontFamily: 'Inter, sans-serif' },
  logoName: { fontWeight: 800, fontSize: 17, color: 'var(--t1)', letterSpacing: '-0.5px' },
  logoTagline: { fontSize: 10, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 },
  divider: { height: 1, background: 'var(--border)', marginBottom: 16 },

  nav: { display: 'flex', flexDirection: 'column', gap: 3 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, transition: 'all 0.2s', width: '100%', fontFamily: 'Inter, sans-serif' },
  navBtnActive: { background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))', color: 'var(--accent3)', border: '1px solid rgba(124,58,237,0.2)' },
  navIcon: { display: 'flex', flexShrink: 0 },
  navLabel: { flex: 1, textAlign: 'left' },
  navCount: { fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 20, color: 'var(--t3)' },
  navCountActive: { background: 'rgba(124,58,237,0.2)', color: 'var(--accent3)' },

  sidebarBottom: { marginTop: 'auto' },
  statsCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' },
  statsTitle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  statsRows: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  statsRow: { display: 'flex', alignItems: 'center', gap: 8 },
  statDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 },
  statKey: { flex: 1, fontSize: 12, color: 'var(--t3)' },
  statNum: { fontSize: 13, fontWeight: 700, color: 'var(--t2)', fontFamily: 'var(--mono)' },
  progressBar: { height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 99, transition: 'width 0.5s ease' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 32px 20px', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(10px)', background: 'rgba(8,8,16,0.6)' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  breadcrumbText: { fontSize: 12, color: 'var(--t3)' },
  breadcrumbSep: { fontSize: 12, color: 'var(--t3)', opacity: 0.4 },
  breadcrumbCurrent: { fontSize: 12, color: 'var(--accent3)' },
  pageTitle: { fontSize: 24, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.8px', background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },

  topActions: { display: 'flex', gap: 8, alignItems: 'center' },
  iconBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-bright)', borderRadius: 10, padding: '9px', cursor: 'pointer', color: 'var(--t2)', display: 'flex', transition: 'all 0.2s' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, boxShadow: '0 4px 16px rgba(124,58,237,0.35)', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' },

  content: { flex: 1, overflow: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16, padding: '28px 32px' },

  centerBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 },
  spinner: { width: 28, height: 28, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 32px', textAlign: 'center' },
  emptyIcon: { width: 64, height: 64, background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: 'var(--t1)' },
  emptyDesc: { fontSize: 14, color: 'var(--t3)', maxWidth: 320 },

  logsWrap: { padding: '28px 32px' },
  logsCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--t3)', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  trow: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  td: { padding: '13px 20px', fontSize: 13, color: 'var(--t2)', verticalAlign: 'middle' },
  codeBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--mono)' },
};

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Activity, Clock, CheckCircle, XCircle, Zap, TrendingUp, Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const switchTab = (t) => { setTab(t); setSidebarOpen(false); };

  const activeJobs = jobs.filter(j => j.is_active).length;
  const successLogs = logs.filter(l => l.status === 'success').length;
  const errorLogs = logs.filter(l => l.status === 'error').length;
  const successRate = logs.length ? Math.round((successLogs / logs.length) * 100) : 0;

  const fmt = (d) => new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  return (
    <div className="app">
      {/* Ambient glows */}
      <div style={s.glow1} />
      <div style={s.glow2} />

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar dot-bg ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="logo-area" style={s.logoArea}>
          <div style={s.logoMark}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="logo-text-wrap">
            <div style={s.logoName}>Kronik</div>
            <div style={s.logoTag}>cron manager</div>
          </div>
        </div>

        <div style={s.divider} />

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'jobs', icon: <Clock size={16} />, label: 'Jobs', count: jobs.length },
            { id: 'logs', icon: <Activity size={16} />, label: 'Logs', count: logs.length },
          ].map(item => (
            <button
              key={item.id}
              className="nav-btn"
              style={{ ...s.navBtn, ...(tab === item.id ? s.navBtnOn : {}) }}
              onClick={() => switchTab(item.id)}
            >
              <span style={{ display: 'flex', flexShrink: 0, color: tab === item.id ? 'var(--accent3)' : 'var(--t3)' }}>{item.icon}</span>
              <span className="sidebar-label" style={{ flex: 1, textAlign: 'left', color: tab === item.id ? 'var(--t1)' : 'var(--t2)' }}>{item.label}</span>
              <span className="sidebar-count" style={{ ...s.navCount, ...(tab === item.id ? s.navCountOn : {}) }}>{item.count}</span>
            </button>
          ))}
        </nav>

        {/* Stats */}
        <div className="stats-card" style={s.statsCard}>
          <div style={s.statsHeader}>
            <TrendingUp size={12} color="var(--accent3)" />
            <span style={s.statsTitle}>Özet</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[
              { label: 'Aktif', val: activeJobs, color: 'var(--cyan)' },
              { label: 'Hata', val: errorLogs, color: errorLogs > 0 ? 'var(--error)' : 'var(--t3)' },
              { label: 'Başarı', val: `${successRate}%`, color: successRate >= 80 ? 'var(--success)' : 'var(--warning)' },
            ].map(item => (
              <div key={item.label} style={s.statRow}>
                <span style={s.statLabel}>{item.label}</span>
                <span style={{ ...s.statVal, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
          <div style={s.progressBg}>
            <div style={{ ...s.progressFg, width: `${successRate}%` }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...s.logoMark, width: 28, height: 28 }}><Zap size={13} color="#fff" /></div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>Kronik</span>
          </div>
          <button style={s.iconBtn} onClick={handleRefresh}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} />
          </button>
        </div>

        {/* Desktop topbar */}
        <div className="topbar desktop-topbar">
          <div>
            <div style={s.breadcrumb}>
              <Zap size={11} color="var(--accent3)" />
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Kronik</span>
              <span style={{ fontSize: 11, color: 'var(--t3)', opacity: 0.4 }}>/</span>
              <span style={{ fontSize: 11, color: 'var(--accent3)' }}>{tab === 'jobs' ? 'Jobs' : 'Logs'}</span>
            </div>
            <h1 style={s.pageTitle}>{tab === 'jobs' ? 'Cron Jobs' : 'Çalışma Logları'}</h1>
            <p style={s.pageDesc}>{tab === 'jobs' ? `${jobs.length} job · ${activeJobs} aktif` : `Son ${logs.length} kayıt`}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={s.iconBtn} onClick={handleRefresh} title="Yenile">
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} />
            </button>
            {tab === 'jobs' && (
              <button style={s.newBtn} onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                <Plus size={15} strokeWidth={2.5} /> Yeni Job
              </button>
            )}
          </div>
        </div>

        {/* Mobile action bar */}
        <div style={{ display: 'none' }} className="mobile-actions">
          {tab === 'jobs' && (
            <button style={{ ...s.newBtn, width: '100%', justifyContent: 'center', borderRadius: 10, margin: '12px 16px 0', width: 'calc(100% - 32px)' }}
              onClick={() => { setEditingJob(null); setModalOpen(true); }}>
              <Plus size={15} /> Yeni Job
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={s.center}>
              <div style={s.spinner} />
            </div>
          ) : tab === 'jobs' ? (
            jobs.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}><Clock size={26} color="var(--accent3)" /></div>
                <p style={s.emptyTitle}>Henüz job yok</p>
                <p style={s.emptyDesc}>İlk cron job'unu oluştur ve API'lerini otomatikleştir.</p>
                <button style={s.newBtn} onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                  <Plus size={15} /> İlk job'u oluştur
                </button>
              </div>
            ) : (
              <>
                {/* Mobile: New job button inside content */}
                <div style={s.mobileNewWrap}>
                  <button style={{ ...s.newBtn, width: '100%', justifyContent: 'center' }}
                    onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                    <Plus size={15} /> Yeni Job
                  </button>
                </div>
                <div className="job-grid">
                  {jobs.map((job, i) => (
                    <div key={job.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                      <JobCard
                        job={job}
                        onEdit={j => { setEditingJob(j); setModalOpen(true); }}
                        onDelete={handleDelete}
                        onTrigger={handleTrigger}
                        onToggle={handleToggle}
                        onClick={setSelectedJob}
                      />
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            <div className="logs-wrap" style={s.logsWrap}>
              {logs.length === 0 ? (
                <div style={s.center}><p style={{ color: 'var(--t3)', fontSize: 14 }}>Henüz log yok.</p></div>
              ) : (
                <div className="logs-card" style={s.logsCard}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                    <thead>
                      <tr>
                        {['', 'Job', 'Kod', 'Süre', 'Zaman'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={s.tr}>
                          <td style={s.td}>
                            {log.status === 'success'
                              ? <CheckCircle size={14} color="var(--success)" />
                              : <XCircle size={14} color="var(--error)" />}
                          </td>
                          <td style={{ ...s.td, color: 'var(--t1)', fontWeight: 600 }}>{log.job_name}</td>
                          <td style={s.td}>
                            {log.status_code ? (
                              <span style={{ ...s.codeBadge, background: log.status_code < 400 ? 'var(--success-bg)' : 'var(--error-bg)', color: log.status_code < 400 ? 'var(--success)' : 'var(--error)' }}>
                                {log.status_code}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ ...s.td, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t3)' }}>{log.duration_ms}ms</td>
                          <td style={{ ...s.td, fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{fmt(log.executed_at)}</td>
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
      {selectedJob && <LogsPanel job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}

const s = {
  glow1: { position: 'fixed', top: -150, left: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  glow2: { position: 'fixed', bottom: -150, right: -100, width: 350, height: 350, background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },

  logoArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 20px' },
  logoMark: { width: 34, height: 34, background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.4)' },
  logoName: { fontWeight: 800, fontSize: 16, color: 'var(--t1)', letterSpacing: '-0.3px' },
  logoTag: { fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 },
  divider: { height: 1, background: 'var(--border)', marginBottom: 14 },

  navBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid transparent', background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, transition: 'all 0.18s', width: '100%' },
  navBtnOn: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' },
  navCount: { fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 20, color: 'var(--t3)', display: 'flex' },
  navCountOn: { background: 'rgba(99,102,241,0.15)', color: 'var(--accent3)' },

  statsCard: { marginTop: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  statsHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  statsTitle: { fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em' },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 12, color: 'var(--t3)' },
  statVal: { fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)' },
  progressBg: { height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99 },
  progressFg: { height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--cyan))', borderRadius: 99, transition: 'width 0.6s ease' },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.5px' },
  pageDesc: { fontSize: 12, color: 'var(--t3)', marginTop: 3 },

  iconBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-bright)', borderRadius: 9, padding: '9px', cursor: 'pointer', color: 'var(--t2)', display: 'flex', transition: 'all 0.2s' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'all 0.2s' },

  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  spinner: { width: 26, height: 26, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },

  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 24px', textAlign: 'center' },
  emptyIcon: { width: 60, height: 60, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: 'var(--t1)' },
  emptyDesc: { fontSize: 13, color: 'var(--t3)', maxWidth: 280 },

  mobileNewWrap: { padding: '14px 16px 0', display: 'none' },

  logsWrap: { padding: '24px 28px' },
  logsCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  th: { textAlign: 'left', padding: '11px 18px', fontSize: 10, fontWeight: 700, color: 'var(--t3)', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  td: { padding: '12px 18px', fontSize: 13, color: 'var(--t2)', verticalAlign: 'middle' },
  codeBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, fontFamily: 'var(--mono)' },
};

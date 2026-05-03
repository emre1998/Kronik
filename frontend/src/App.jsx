import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Activity, Clock, CheckCircle, XCircle, Zap, TrendingUp, Menu } from 'lucide-react';
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
    const [j, l] = await Promise.all([getJobs(), getLogs()]);
    setJobs(j.data); setLogs(l.data); setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 15000); return () => clearInterval(t); }, [fetchAll]);

  const handleRefresh = async () => { setRefreshing(true); await fetchAll(); setTimeout(() => setRefreshing(false), 600); };
  const handleSave = async (d) => { editingJob ? await updateJob(editingJob.id, d) : await createJob(d); setEditingJob(null); fetchAll(); };
  const handleDelete = async (id) => { if (!confirm('Bu job silinecek. Emin misin?')) return; await deleteJob(id); fetchAll(); };
  const handleTrigger = async (id) => { await triggerJob(id); setTimeout(fetchAll, 800); };
  const handleToggle = async (job) => { await updateJob(job.id, { is_active: !job.is_active }); fetchAll(); };
  const switchTab = (t) => { setTab(t); setSidebarOpen(false); };

  const active = jobs.filter(j => j.is_active).length;
  const success = logs.filter(l => l.status === 'success').length;
  const errors = logs.filter(l => l.status === 'error').length;
  const rate = logs.length ? Math.round((success / logs.length) * 100) : 0;

  const fmt = (d) => new Date(d).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });

  return (
    <div className="app">
      <div className="noise" />

      {/* Overlay */}
      <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <div className="logo">
            <div className="logo-icon">
              <Zap size={18} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div className="logo-name">Kronik</div>
              <div className="logo-sub">cron manager</div>
            </div>
          </div>

          <div className="divider" />

          <nav className="nav">
            {[
              { id: 'jobs', icon: <Clock size={15} />, label: 'Jobs', count: jobs.length },
              { id: 'logs', icon: <Activity size={15} />, label: 'Logs', count: logs.length },
            ].map(item => (
              <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => switchTab(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-badge">{item.count}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-widget">
            <div className="widget-title"><TrendingUp size={11} /> İstatistik</div>
            {[
              { key: 'Aktif', val: active, color: 'var(--cyan)' },
              { key: 'Hata', val: errors, color: errors > 0 ? 'var(--error)' : 'var(--t3)' },
              { key: 'Başarı', val: `${rate}%`, color: rate >= 80 ? 'var(--success)' : 'var(--accent)' },
            ].map(r => (
              <div className="widget-row" key={r.key}>
                <span className="widget-key">{r.key}</span>
                <span className="widget-val" style={{ color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div className="progress"><div className="progress-fill" style={{ width: `${rate}%` }} /></div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {/* Mobile topbar */}
        <div className="mob-bar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="logo-icon" style={{ width: 28, height: 28 }}><Zap size={13} color="#000" /></div>
            <span style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: 16 }}>Kronik</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-icon" onClick={handleRefresh}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} />
            </button>
            {tab === 'jobs' && (
              <button className="btn-new" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                <Plus size={14} /> Yeni
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          {[
            { num: jobs.length, lbl: 'Toplam Job', color: 'var(--t1)' },
            { num: active, lbl: 'Aktif', color: 'var(--cyan)' },
            { num: errors, lbl: 'Hata', color: errors > 0 ? 'var(--error)' : 'var(--t3)' },
            { num: `${rate}%`, lbl: 'Başarı Oranı', color: rate >= 80 ? 'var(--success)' : 'var(--accent)' },
          ].map(s => (
            <div className="stat-box" key={s.lbl}>
              <span className="stat-num" style={{ color: s.color }}>{s.num}</span>
              <span className="stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* Desktop topbar */}
        <div className="topbar">
          <div>
            <div className="breadcrumb">
              <Zap size={11} color="var(--accent)" />
              <span>Kronik</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-cur">{tab === 'jobs' ? 'Jobs' : 'Logs'}</span>
            </div>
            <h1 className="page-title">{tab === 'jobs' ? 'Cron Jobs' : 'Çalışma Logları'}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-icon" onClick={handleRefresh}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear' : 'none' }} />
            </button>
            {tab === 'jobs' && (
              <button className="btn-new" onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                <Plus size={15} /> Yeni Job
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div className="center"><div className="spinner" /></div>
          ) : tab === 'jobs' ? (
            jobs.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><Clock size={26} color="var(--accent)" /></div>
                <p className="empty-title">Henüz job yok</p>
                <p className="empty-desc">İlk cron job'unu oluştur ve API'lerini otomatikleştir.</p>
                <button className="btn-new" onClick={() => { setEditingJob(null); setModalOpen(true); }}>
                  <Plus size={15} /> İlk job'u oluştur
                </button>
              </div>
            ) : (
              <div className="job-grid">
                {jobs.map((job, i) => (
                  <div key={job.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <JobCard job={job}
                      onEdit={j => { setEditingJob(j); setModalOpen(true); }}
                      onDelete={handleDelete} onTrigger={handleTrigger}
                      onToggle={handleToggle} onClick={setSelectedJob}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="logs-wrap">
              {logs.length === 0 ? (
                <div className="center"><p style={{ color: 'var(--t3)', fontSize: 14 }}>Henüz log yok.</p></div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div className="logs-table-wrap">
                    <table className="logs-table">
                      <thead>
                        <tr>
                          {['', 'Job', 'Kod', 'Süre', 'Zaman'].map(h => <th key={h} className="logs-th">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log.id} className="logs-tr">
                            <td className="logs-td">
                              {log.status === 'success' ? <CheckCircle size={14} color="var(--success)" /> : <XCircle size={14} color="var(--error)" />}
                            </td>
                            <td className="logs-td" style={{ color: 'var(--t1)', fontWeight: 600 }}>{log.job_name}</td>
                            <td className="logs-td">
                              {log.status_code
                                ? <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, background: log.status_code < 400 ? 'var(--success-bg)' : 'var(--error-bg)', color: log.status_code < 400 ? 'var(--success)' : 'var(--error)' }}>{log.status_code}</span>
                                : '—'}
                            </td>
                            <td className="logs-td" style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--t3)' }}>{log.duration_ms}ms</td>
                            <td className="logs-td" style={{ fontSize:11, color:'var(--t3)', whiteSpace:'nowrap' }}>{fmt(log.executed_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {modalOpen && <JobModal job={editingJob} onClose={() => { setModalOpen(false); setEditingJob(null); }} onSave={handleSave} />}
      {selectedJob && <LogsPanel job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}

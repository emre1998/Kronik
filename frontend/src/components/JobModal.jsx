import { useState, useEffect } from 'react';
import { X, Zap, ChevronDown, Bell } from 'lucide-react';

const NOTIFY_OPTIONS = [
  { value: 'always', label: '🔔 Her zaman', desc: 'Başarı ve hata' },
  { value: 'error',  label: '🔴 Sadece hata', desc: 'Yalnızca başarısız olunca' },
  { value: 'never',  label: '🔕 Kapalı', desc: 'Bildirim gönderme' },
];

const PRESETS = [
  { label: 'Her dakika', value: '* * * * *' },
  { label: 'Her 5 dk', value: '*/5 * * * *' },
  { label: 'Her 15 dk', value: '*/15 * * * *' },
  { label: 'Her 30 dk', value: '*/30 * * * *' },
  { label: 'Her saat', value: '0 * * * *' },
  { label: 'Her gün', value: '0 0 * * *' },
  { label: 'Her Pzt', value: '0 9 * * 1' },
];

const DEFAULTS = { name: '', url: '', method: 'GET', headers: '', body: '', cron_expression: '*/5 * * * *', is_active: true, notify_on: 'always' };

export default function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) setForm({ ...job, headers: job.headers ? JSON.stringify(job.headers, null, 2) : '' });
  }, [job]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.url || !form.cron_expression) {
      setError('İsim, URL ve cron expression zorunlu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let headers = {};
      if (form.headers) headers = JSON.parse(form.headers);
      await onSave({ ...form, headers });
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Glow top edge */}
        <div style={s.glowEdge} />

        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.headerIcon}><Zap size={14} color="#c084fc" /></div>
            <span style={s.title}>{job ? 'Job Düzenle' : 'Yeni Job Oluştur'}</span>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={s.body}>
          {error && <div style={s.errorBox}>{error}</div>}

          <Field label="İsim">
            <input placeholder="Günlük rapor gönder" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>

          <Field label="URL">
            <input style={{ fontFamily: 'var(--mono)', fontSize: 12 }} placeholder="https://api.example.com/endpoint" value={form.url} onChange={(e) => set('url', e.target.value)} />
          </Field>

          <div style={s.row2}>
            <Field label="Method">
              <div style={s.selectWrap}>
                <select value={form.method} onChange={(e) => set('method', e.target.value)}>
                  {['GET','POST','PUT','PATCH','DELETE'].map((m) => <option key={m}>{m}</option>)}
                </select>
                <ChevronDown size={13} style={s.chevron} />
              </div>
            </Field>
            <Field label="Durum">
              <button
                style={{ ...s.toggleBtn, background: form.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, color: form.is_active ? '#10b981' : '#475569' }}
                onClick={() => set('is_active', !form.is_active)}
              >
                <span style={{ ...s.toggleDot, background: form.is_active ? '#10b981' : '#475569' }} />
                {form.is_active ? 'Aktif' : 'Pasif'}
              </button>
            </Field>
          </div>

          <Field label="Cron Expression">
            <input style={{ fontFamily: 'var(--mono)', fontSize: 13 }} placeholder="*/5 * * * *" value={form.cron_expression} onChange={(e) => set('cron_expression', e.target.value)} />
            <div style={s.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  style={{ ...s.preset, ...(form.cron_expression === p.value ? s.presetOn : {}) }}
                  onClick={() => set('cron_expression', p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={<><Bell size={12} style={{display:'inline',marginRight:4}} />Telegram Bildirimi</>}>
            <div style={s.notifyGroup}>
              {NOTIFY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={{ ...s.notifyBtn, ...(form.notify_on === opt.value ? s.notifyBtnOn : {}) }}
                  onClick={() => set('notify_on', opt.value)}
                >
                  <span style={{ fontSize: 13 }}>{opt.label}</span>
                  <span style={{ fontSize: 11, color: form.notify_on === opt.value ? '#a78bfa' : 'var(--t3)' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label={<>Headers <span style={s.opt}>JSON, opsiyonel</span></>}>
            <textarea style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }} rows={3} placeholder={'{\n  "Authorization": "Bearer token"\n}'} value={form.headers} onChange={(e) => set('headers', e.target.value)} />
          </Field>

          {['POST','PUT','PATCH'].includes(form.method) && (
            <Field label={<>Body <span style={s.opt}>opsiyonel</span></>}>
              <textarea style={{ fontFamily: 'var(--mono)', fontSize: 12, resize: 'vertical' }} rows={4} placeholder={'{\n  "key": "value"\n}'} value={form.body} onChange={(e) => set('body', e.target.value)} />
            </Field>
          )}
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>İptal</button>
          <button style={s.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Kaydediliyor</span> : job ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b', letterSpacing: '0.02em' }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#0d0d18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)' },
  glowEdge: { position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerIcon: { width: 28, height: 28, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: 700, fontSize: 15.5, color: '#f8fafc' },
  closeBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#475569', display: 'flex', padding: 6, borderRadius: 8, transition: 'all 0.2s' },
  body: { padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  opt: { fontWeight: 400, color: '#334155', fontSize: 11 },
  selectWrap: { position: 'relative' },
  chevron: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#475569' },
  toggleBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' },
  toggleDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  presets: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  preset: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '4px 11px', fontSize: 11.5, color: '#475569', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' },
  presetOn: { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#c084fc' },
  footer: { display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', justifyContent: 'flex-end' },
  cancelBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', color: '#64748b', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, fontFamily: 'Inter, sans-serif' },
  saveBtn: { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, boxShadow: '0 4px 16px rgba(124,58,237,0.4)', fontFamily: 'Inter, sans-serif', minWidth: 100 },
  errorBox: { background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '10px 14px', color: '#fda4af', fontSize: 13 },
  notifyGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  notifyBtn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', textAlign: 'left' },
  notifyBtnOn: { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' },
};

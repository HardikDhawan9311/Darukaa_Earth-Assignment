import React, { useEffect, useMemo, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { TrendingUp, TrendingDown, Trees, Activity, Globe, BarChart2, Download, Calendar } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-backend.onrender.com';

const CHART_BASE = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f1420', titleColor: '#10b981',
      bodyColor: '#94a3b8', borderColor: '#1e2433', borderWidth: 1,
      padding: 10, displayColors: false,
    },
  },
};

const LINE_OPTS = {
  ...CHART_BASE,
  scales: {
    x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10, family: 'JetBrains Mono' } } },
    y: { grid: { color: '#1e2433', drawBorder: false }, ticks: { display: false } },
  },
};

const BAR_OPTS = {
  ...CHART_BASE,
  indexAxis: 'y',
  scales: {
    x: { grid: { color: '#1e2433', drawBorder: false }, ticks: { color: '#475569', font: { size: 10 } } },
    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 12, family: 'Inter' } } },
  },
};

const DONUT_OPTS = {
  ...CHART_BASE,
  cutout: '70%',
};

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/* KPI Stat card */
const KpiCard = ({ icon: Icon, label, value, color, up, delay = 0 }) => (
  <div className="card fade-up" style={{ padding: '16px 18px', height: 88, display: 'flex', alignItems: 'center', gap: 14, animationDelay: `${delay}s` }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}1e`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={18} color={color} strokeWidth={1.5} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: up ? 'var(--color-green)' : 'var(--color-red)', fontSize: 11, fontWeight: 500 }}>
      {up ? <TrendingUp size={13} strokeWidth={1.5} /> : <TrendingDown size={13} strokeWidth={1.5} />}
      <span>live</span>
    </div>
  </div>
);

/* Section card wrapper */
const SectionCard = ({ title, children, style }) => (
  <div className="card" style={{ padding: 18, ...style }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>{title}</div>
    {children}
  </div>
);

const AnalyticsPage = () => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [analyticsRows, setAnalyticsRows] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [carbonScore, setCarbonScore] = useState('0.50');
  const [biodiversityIndex, setBiodiversityIndex] = useState('0.50');
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  async function loadAll(cancelled = false) {
    try {
      const [pr, sr] = await Promise.all([fetch(`${API_BASE_URL}/api/projects`), fetch(`${API_BASE_URL}/api/sites`)]);
      const pd = pr.ok ? await pr.json() : [];
      const sd = sr.ok ? await sr.json() : [];
      if (cancelled) return;
      const safeP = Array.isArray(pd) ? pd : [];
      const safeS = Array.isArray(sd) ? sd : [];
      setProjects(safeP); setSites(safeS);
      if (!selectedProjectId && safeP.length > 0) setSelectedProjectId(String(safeP[0].id));
      const allRows = [];
      await Promise.all(safeS.map(async (s) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/analytics/${s.id}`);
          const data = res.ok ? await res.json() : [];
          (Array.isArray(data) ? data : []).forEach((row) => allRows.push({ ...row, site_name: s.name, project_id: s.project_id }));
        } catch { /* ignore */ }
      }));
      if (!cancelled) setAnalyticsRows(allRows);
    } catch {
      if (!cancelled) { setProjects([]); setSites([]); setAnalyticsRows([]); }
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => { await loadAll(cancelled); })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSites = useMemo(
    () => selectedProjectId ? sites.filter((s) => String(s.project_id) === String(selectedProjectId)) : sites,
    [sites, selectedProjectId]
  );

  useEffect(() => {
    if (!filteredSites.some((s) => String(s.id) === String(selectedSiteId))) {
      setSelectedSiteId(filteredSites[0] ? String(filteredSites[0].id) : '');
    }
  }, [filteredSites, selectedSiteId]);

  async function handleAddAnalytics(e) {
    e.preventDefault();
    setFormMessage('');
    const siteIdNum = Number(selectedSiteId);
    const carbonNum = Number(carbonScore);
    const bioNum = Number(biodiversityIndex);
    if (!siteIdNum) { setFormMessage('Please select a site.'); return; }
    if (isNaN(carbonNum) || carbonNum < 0 || carbonNum > 1) { setFormMessage('Carbon score must be 0–1.'); return; }
    if (isNaN(bioNum) || bioNum < 0 || bioNum > 1) { setFormMessage('Biodiversity must be 0–1.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: siteIdNum, carbon_score: carbonNum, biodiversity_index: bioNum }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.detail || 'Failed'); }
      setFormMessage('Saved successfully.');
      await loadAll(false);
    } catch (err) { setFormMessage(err?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  }

  /* Derived metrics */
  const avgCarbon = useMemo(() => {
    if (!analyticsRows.length) return 0;
    return Math.round(analyticsRows.reduce((a, r) => a + Number(r.carbon_score || 0), 0) / analyticsRows.length * 100);
  }, [analyticsRows]);

  // eslint-disable-next-line no-unused-vars
  const avgBio = useMemo(() => {
    if (!analyticsRows.length) return 0;
    return Math.round(analyticsRows.reduce((a, r) => a + Number(r.biodiversity_index || 0), 0) / analyticsRows.length * 100);
  }, [analyticsRows]);

  /* Chart data */
  const sorted = useMemo(() => [...analyticsRows].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)), [analyticsRows]);

  const lineData = {
    labels: sorted.map((_, i) => `${i + 1}`),
    datasets: [
      {
        label: 'Carbon', data: sorted.map((r) => Math.round(Number(r.carbon_score || 0) * 100)),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)',
        fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2,
        pointBackgroundColor: '#10b981',
      },
      {
        label: 'Biodiversity', data: sorted.map((r) => Math.round(Number(r.biodiversity_index || 0) * 100)),
        borderColor: '#3b82f6', backgroundColor: 'transparent',
        fill: false, tension: 0.4, pointRadius: 2, borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
      },
    ],
  };

  /* Horizontal bio bar — top 6 sites */
  const topSites = useMemo(() => {
    const map = {};
    analyticsRows.forEach((r) => {
      if (!map[r.site_name]) map[r.site_name] = { carbon: [], bio: [] };
      map[r.site_name].carbon.push(Number(r.carbon_score || 0));
      map[r.site_name].bio.push(Number(r.biodiversity_index || 0));
    });
    return Object.entries(map).map(([name, v]) => ({
      name,
      carbon: Math.round(v.carbon.reduce((a, b) => a + b, 0) / v.carbon.length * 100),
      bio: Math.round(v.bio.reduce((a, b) => a + b, 0) / v.bio.length * 100),
    })).sort((a, b) => b.bio - a.bio).slice(0, 6);
  }, [analyticsRows]);

  const bioBarData = {
    labels: topSites.map((s) => s.name.length > 18 ? s.name.slice(0, 16) + '…' : s.name),
    datasets: [{ label: 'Biodiversity %', data: topSites.map((s) => s.bio), backgroundColor: '#3b82f6', borderRadius: 4, borderSkipped: false }],
  };

  /* Donut */
  const donutData = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const siteProjectMap = new Map(sites.map((s) => [s.id, s.project_id]));
    const counts = new Map();
    analyticsRows.forEach((r) => {
      const pid = siteProjectMap.get(r.site_id) ?? r.project_id;
      const name = projectMap.get(pid) || `Project ${pid ?? 'N/A'}`;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const labels = Array.from(counts.keys());
    const values = Array.from(counts.values());
    const total = values.reduce((a, b) => a + b, 0) || 1;
    return {
      labels,
      datasets: [{ data: values.map((v) => Math.round(v / total * 100)), backgroundColor: DONUT_COLORS, borderWidth: 0, hoverOffset: 4 }],
    };
  }, [analyticsRows, projects, sites]);

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, sans-serif' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)' }}>
          Analytics
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ height: 34, fontSize: 13, gap: 6 }}>
            <Calendar size={14} strokeWidth={1.5} />
            Last 30 days
            <span style={{ fontSize: 12 }}>▾</span>
          </button>
          <button className="btn btn-ghost" style={{ height: 34, fontSize: 13, gap: 6 }}>
            <Download size={14} strokeWidth={1.5} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard icon={BarChart2} label="Total records"    value={analyticsRows.length} color="#10b981" up delay={0}    />
        <KpiCard icon={Trees}     label="Avg carbon score" value={`${avgCarbon}%`}       color="#10b981" up delay={0.05} />
        <KpiCard icon={Globe}     label="Sites reporting"  value={`${topSites.length}`}  color="#3b82f6" up delay={0.1}  />
        <KpiCard icon={Activity}  label="Alerts this month" value="—"                    color="#f59e0b" up={false} delay={0.15} />
      </div>

      {/* Add analytics form */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>
          Record analytics
        </div>
        <form onSubmit={handleAddAnalytics} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Project */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5 }}>Project</label>
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="input" style={{ height: 36, fontSize: 13 }}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {/* Site */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5 }}>Site</label>
            <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} className="input" style={{ height: 36, fontSize: 13 }}>
              {filteredSites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {/* Carbon */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5 }}>Carbon (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" value={carbonScore} onChange={(e) => setCarbonScore(e.target.value)} className="input" style={{ height: 36, fontSize: 13 }} />
          </div>
          {/* Bio */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5 }}>Biodiversity (0–1)</label>
            <input type="number" min="0" max="1" step="0.01" value={biodiversityIndex} onChange={(e) => setBiodiversityIndex(e.target.value)} className="input" style={{ height: 36, fontSize: 13 }} />
          </div>
          <div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ height: 36, fontSize: 13 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {formMessage && <div style={{ width: '100%', fontSize: 12, color: formMessage.includes('success') ? 'var(--color-green)' : 'var(--color-red)' }}>{formMessage}</div>}
        </form>
      </div>

      {/* Charts — 2 col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Line chart */}
          <SectionCard title="Carbon score over time">
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              {[{ label: 'Carbon', color: '#10b981' }, { label: 'Biodiversity', color: '#3b82f6' }].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 180 }}>
              <Line data={lineData} options={LINE_OPTS} />
            </div>
          </SectionCard>

          {/* Horizontal bar */}
          <SectionCard title="Biodiversity by site">
            <div style={{ height: 180 }}>
              <Bar data={bioBarData} options={BAR_OPTS} />
            </div>
          </SectionCard>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Doughnut */}
          <SectionCard title="Carbon distribution">
            <div style={{ height: 160, display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={donutData} options={DONUT_OPTS} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(donutData.labels || []).map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i] }} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {donutData.datasets[0].data[i] || 0}%
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Top sites */}
          <SectionCard title="Top performing sites" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Site</th>
                  <th style={{ textAlign: 'right' }}>Carbon</th>
                  <th style={{ textAlign: 'right' }}>Bio</th>
                </tr>
              </thead>
              <tbody>
                {topSites.map((s) => (
                  <tr key={s.name}>
                    <td style={{ fontSize: 12 }}>{s.name}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--color-green)', fontWeight: 600 }}>{s.carbon}%</td>
                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--color-blue)', fontWeight: 600 }}>{s.bio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </div>

      {/* All records table */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>All measurement records</span>
          <span className="badge-blue" style={{ fontSize: 11, padding: '3px 10px' }}>{analyticsRows.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Project ID</th>
                <th style={{ textAlign: 'right' }}>Carbon %</th>
                <th style={{ textAlign: 'right' }}>Biodiversity %</th>
                <th>Recorded at</th>
              </tr>
            </thead>
            <tbody>
              {analyticsRows.slice(0, 25).map((r) => (
                <tr key={r.id}>
                  <td>{r.site_name || '—'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)' }}>{r.project_id ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--color-green)' }}>{Math.round(Number(r.carbon_score || 0) * 100)}%</td>
                  <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--color-blue)' }}>{Math.round(Number(r.biodiversity_index || 0) * 100)}%</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {r.recorded_at ? new Date(r.recorded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {analyticsRows.length > 25 && (
          <div style={{ padding: '12px 0 0', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Showing 1–25 of {analyticsRows.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

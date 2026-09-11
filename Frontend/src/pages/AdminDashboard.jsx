import React, { useEffect, useMemo, useState } from 'react';
import ProjectCard from '../components/dashboard/ProjectCard';
import MapboxContainer from '../components/dashboard/MapboxContainer';
import AnalyticsStream from '../components/dashboard/AnalyticsStream';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { FolderOpen, MapPin, Trees, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-backend.onrender.com';
const DEFAULT_COORDS = [78.9629, 22.5937];

const CHART_CONFIG = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f1420',
      titleColor: '#10b981',
      bodyColor: '#94a3b8',
      borderColor: '#1e2433',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10, family: 'JetBrains Mono' } } },
    y: { grid: { color: '#1e2433', drawBorder: false }, ticks: { display: false } },
  },
};

function parseDescription(desc) {
  try { return desc ? JSON.parse(desc) : {}; } catch { return {}; }
}

/* ─── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <div className="card fade-up" style={{ padding: '16px 18px', animationDelay: `${delay}s`, display: 'flex', alignItems: 'center', gap: 14, height: 88 }}>
    <div style={{
      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
      background: `${color}1e`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color={color} strokeWidth={1.5} />
    </div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 26, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [analyticsBySite, setAnalyticsBySite] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pr, sr] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`),
          fetch(`${API_BASE_URL}/api/sites`),
        ]);
        const pd = pr.ok ? await pr.json() : [];
        const sd = sr.ok ? await sr.json() : [];
        if (cancelled) return;

        const mapped = (Array.isArray(pd) ? pd : []).map((p) => {
          const meta = parseDescription(p.description);
          const center = Array.isArray(meta.center) && meta.center.length === 2 ? meta.center : DEFAULT_COORDS;
          return {
            id: p.id, name: p.name,
            status: p.status || meta.status || 'Active',
            region: [meta.state, meta.country].filter(Boolean).join(', ') || '—',
            carbon: 0, biodiversity: 0,
            lastUpdated: p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            coords: center,
          };
        });

        setProjects(mapped);
        setSites(Array.isArray(sd) ? sd : []);
        if (mapped.length > 0) setSelectedProject(mapped[0]);

        const siteList = Array.isArray(sd) ? sd : [];
        const analyticsMap = {};
        await Promise.all(siteList.map(async (s) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/analytics/${s.id}`);
            const data = res.ok ? await res.json() : [];
            analyticsMap[s.id] = Array.isArray(data) ? data : [];
            analyticsMap[String(s.id)] = Array.isArray(data) ? data : [];
          } catch {
            analyticsMap[s.id] = [];
            analyticsMap[String(s.id)] = [];
          }
        }));
        if (!cancelled) setAnalyticsBySite(analyticsMap);
      } catch {
        if (!cancelled) { setProjects([]); setSites([]); setAnalyticsBySite({}); setSelectedProject(null); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const allAnalytics = useMemo(
    () => Object.values(analyticsBySite).flat(),
    [analyticsBySite]
  );

  const globalAvgCarbon = useMemo(() => {
    if (!allAnalytics.length) return 0;
    return Math.round(allAnalytics.reduce((a, r) => a + Number(r.carbon_score || 0), 0) / allAnalytics.length * 100);
  }, [allAnalytics]);

  const globalAvgBio = useMemo(() => {
    if (!allAnalytics.length) return 0;
    return Math.round(allAnalytics.reduce((a, r) => a + Number(r.biodiversity_index || 0), 0) / allAnalytics.length * 100);
  }, [allAnalytics]);

  const projectsWithMetrics = useMemo(() => {
    return projects.map((p) => {
      const pSites = sites.filter((s) => String(s.project_id) === String(p.id));
      const pAnalytics = pSites.flatMap((s) => {
        const rows = analyticsBySite[s.id] || analyticsBySite[String(s.id)] || [];
        return Array.isArray(rows) ? rows : [];
      });
      const carbon = pAnalytics.length
        ? Math.round(pAnalytics.reduce((a, r) => a + Number(r.carbon_score || 0), 0) / pAnalytics.length * 100)
        : 0;
      const biodiversity = pAnalytics.length
        ? Math.round(pAnalytics.reduce((a, r) => a + Number(r.biodiversity_index || 0), 0) / pAnalytics.length * 100)
        : 0;
      return { ...p, carbon, biodiversity, siteCount: pSites.length };
    });
  }, [projects, sites, analyticsBySite]);

  const activeSelectedProject = useMemo(() => {
    if (!selectedProject) return null;
    return projectsWithMetrics.find((p) => String(p.id) === String(selectedProject.id)) || selectedProject;
  }, [projectsWithMetrics, selectedProject]);

  const selectedProjectSites = useMemo(
    () => activeSelectedProject ? sites.filter((s) => String(s.project_id) === String(activeSelectedProject.id)) : [],
    [sites, activeSelectedProject]
  );

  const projectAnalytics = useMemo(
    () => selectedProjectSites.flatMap((s) => {
      const rows = analyticsBySite[s.id] || analyticsBySite[String(s.id)] || [];
      return Array.isArray(rows) ? rows : [];
    }),
    [selectedProjectSites, analyticsBySite]
  );

  const selectedAvgCarbon = useMemo(() => {
    if (!projectAnalytics.length) return 0;
    return Math.round(projectAnalytics.reduce((a, r) => a + Number(r.carbon_score || 0), 0) / projectAnalytics.length * 100);
  }, [projectAnalytics]);

  const selectedAvgBio = useMemo(() => {
    if (!projectAnalytics.length) return 0;
    return Math.round(projectAnalytics.reduce((a, r) => a + Number(r.biodiversity_index || 0), 0) / projectAnalytics.length * 100);
  }, [projectAnalytics]);

  const lineData = {
    labels: projectAnalytics.map((_, i) => `${i + 1}`),
    datasets: [{
      label: 'Carbon Score',
      data: projectAnalytics.map((r) => Math.round(Number(r.carbon_score || 0) * 100)),
      borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)',
      fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2,
      pointBackgroundColor: '#10b981',
    }],
  };

  const bioData = {
    labels: projectAnalytics.map((_, i) => `${i + 1}`),
    datasets: [{
      label: 'Biodiversity',
      data: projectAnalytics.map((r) => Math.round(Number(r.biodiversity_index || 0) * 100)),
      backgroundColor: 'rgba(59,130,246,0.5)', borderColor: '#3b82f6',
      borderWidth: 1, borderRadius: 4,
    }],
  };

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard icon={FolderOpen} label="Projects"          value={projects.length} color="#10b981" delay={0}    />
        <StatCard icon={MapPin}     label="Active sites"      value={sites.length}    color="#3b82f6" delay={0.05} />
        <StatCard icon={Trees}      label="Avg carbon score"  value={`${globalAvgCarbon}%`} color="#10b981" delay={0.1}  />
        <StatCard icon={Activity}   label="Avg biodiversity"  value={`${globalAvgBio}%`}    color="#f59e0b" delay={0.15} />
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: 16, flex: 1, minHeight: 480 }}>

        {/* Column 1 — Project list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                Geo Projects
              </span>
              <span className="badge-green" style={{ fontSize: 11, padding: '2px 8px' }}>
                {projects.length}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {projects.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-muted)' }}>
                <FolderOpen size={24} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: 13 }}>No projects yet</span>
              </div>
            ) : projectsWithMetrics.map((p) => (
              <ProjectCard
                key={p.id} project={p}
                isSelected={String(activeSelectedProject?.id) === String(p.id)}
                onClick={() => setSelectedProject(p)}
              />
            ))}
          </div>
        </div>

        {/* Column 2 — Map */}
        <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
          <MapboxContainer
            coords={activeSelectedProject?.coords || DEFAULT_COORDS}
            loading={false}
            persistedSites={selectedProjectSites}
          />
        </div>

        {/* Column 3 — Analytics */}
        <div style={{ overflow: 'auto' }}>
          <AnalyticsStream
            lineData={lineData}
            barData={bioData}
            chartConfig={CHART_CONFIG}
            selectedProject={activeSelectedProject || { name: 'No Project Selected' }}
            avgCarbon={selectedAvgCarbon}
            avgBio={selectedAvgBio}
            siteCount={selectedProjectSites.length}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

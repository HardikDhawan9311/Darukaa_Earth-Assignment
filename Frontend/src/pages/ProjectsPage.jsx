import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Search, Trees, Activity, MapPin, Eye, Plus, X, FolderOpen, Trash2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-backend.onrender.com';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

function mapProjectToUi(project) {
  let parsed = {};
  try { parsed = project?.description ? JSON.parse(project.description) : {}; } catch { parsed = {}; }
  const region = [parsed?.state, parsed?.country].filter(Boolean).join(', ') || project.description || '—';
  return {
    id: project.id, name: project.name, region,
    status: project.status || parsed?.status || 'Active',
    carbon: parsed?.carbon || 0, biodiversity: parsed?.biodiversity || 0,
    siteCount: 0,
    lastUpdated: project.created_at
      ? new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—',
  };
}

const STATUSES = ['All', 'Active', 'In Progress', 'Ended'];

/* Badge for status */
const StatusBadge = ({ status }) => {
  const cls = status === 'Active' ? 'badge-green' : status === 'In Progress' ? 'badge-amber' : 'badge-red';
  return <span className={`badge ${cls}`} style={{ fontSize: 10, padding: '2px 8px' }}>{status}</span>;
};

// Modal form field wrapper
const ModalField = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);

const ProjectsPage = () => {
  const currentUser = useMemo(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [analyticsBySite, setAnalyticsBySite] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newStateName, setNewStateName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapPickerError, setMapPickerError] = useState(null);
  const [creating, setCreating] = useState(false);

  const mapPickerRef = useRef(null);
  const mapPickerInstanceRef = useRef(null);
  const markerRef = useRef(null);

  /* Load projects + sites */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setApiError(null);
      try {
        const [pr, sr] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`),
          fetch(`${API_BASE_URL}/api/sites`),
        ]);
        const pd = pr.ok ? await pr.json() : [];
        const sd = sr.ok ? await sr.json() : [];
        const safeP = Array.isArray(pd) ? pd.map(mapProjectToUi) : [];
        const safeS = Array.isArray(sd) ? sd : [];

        const analyticsMap = {};
        await Promise.all(safeS.map(async (s) => {
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

        if (!cancelled) {
          setProjects(safeP);
          setSites(safeS);
          setAnalyticsBySite(analyticsMap);
        }
      } catch (e) {
        if (!cancelled) setApiError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Enrich projects with site counts and real telemetry averages */
  const enriched = useMemo(() =>
    projects.map((p) => {
      const pSites = sites.filter((s) => String(s.project_id) === String(p.id));
      const pAnalytics = pSites.flatMap((s) => {
        const rows = analyticsBySite[s.id] || analyticsBySite[String(s.id)] || [];
        return Array.isArray(rows) ? rows : [];
      });
      const carbon = pAnalytics.length
        ? Math.round(pAnalytics.reduce((a, r) => a + Number(r.carbon_score || 0), 0) / pAnalytics.length * 100)
        : p.carbon || 0;
      const biodiversity = pAnalytics.length
        ? Math.round(pAnalytics.reduce((a, r) => a + Number(r.biodiversity_index || 0), 0) / pAnalytics.length * 100)
        : p.biodiversity || 0;
      return { ...p, carbon, biodiversity, siteCount: pSites.length };
    }),
    [projects, sites, analyticsBySite]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(q) || (p.region || '').toLowerCase().includes(q);
      const matchFilter = filter === 'All' || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [enriched, search, filter]);

  /* Map picker */
  useEffect(() => {
    if (!isCreateOpen || !mapPickerRef.current || mapPickerInstanceRef.current) return;
    const map = new mapboxgl.Map({
      container: mapPickerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [78.9629, 22.5937], zoom: 3,
    });
    mapPickerInstanceRef.current = map;
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedCoords([lng, lat]); setMapPickerError(null);
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ color: '#10b981' }).setLngLat([lng, lat]).addTo(map);
      } else { markerRef.current.setLngLat([lng, lat]); }
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=region,country&access_token=${MAPBOX_TOKEN}`);
        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        const country = features.find((f) => f.place_type?.includes('country'));
        const region = features.find((f) => f.place_type?.includes('region'));
        if (country?.text) setNewCountry(country.text);
        if (region?.text) setNewStateName(region.text);
      } catch { setMapPickerError('Could not reverse-geocode location.'); }
    });
    return () => {
      mapPickerInstanceRef.current?.remove();
      mapPickerInstanceRef.current = null; markerRef.current = null;
    };
  }, [isCreateOpen]);

  async function handleCreateProject(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!selectedCoords) { setApiError('Click on the map to pick a location.'); return; }
    setCreating(true); setApiError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: JSON.stringify({ country: newCountry.trim(), state: newStateName.trim() || null, center: selectedCoords, notes: newDescription.trim() || null }),
        }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.detail || 'Create failed'); }
      const refreshed = await fetch(`${API_BASE_URL}/api/projects`).then((r) => r.json());
      setProjects(Array.isArray(refreshed) ? refreshed.map(mapProjectToUi) : []);
      setIsCreateOpen(false); setNewName(''); setNewCountry(''); setNewStateName(''); setNewDescription(''); setSelectedCoords(null);
    } catch (e2) { setApiError(e2.message || 'Failed to create project'); }
    finally { setCreating(false); }
  }

  async function handleStatusChange(projectId, newStatus) {
    if (!isAdmin) {
      setApiError('Permission denied. Environmental Analysts and non-admin users cannot change project status.');
      return;
    }
    try {
      setApiError(null);
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
    } catch (e) {
      setApiError(e.message || 'Status update failed');
    }
  }

  async function handleDeleteProject(project) {
    if (!isAdmin) {
      setApiError('Permission denied. Environmental Analysts and non-admin users cannot delete projects.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This will permanently delete the project and all associated sites.`)) return;
    try {
      setApiError(null);
      const res = await fetch(`${API_BASE_URL}/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (e) {
      setApiError(e.message || 'Delete failed');
    }
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)' }}>
          Projects
        </h1>
        {isAdmin && (
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary" style={{ height: 34, fontSize: 13, gap: 6 }}>
            <Plus size={14} strokeWidth={2} />
            New project
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 280, height: 36, background: 'var(--color-card-raised)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0 12px' }}>
          <Search size={14} color="var(--color-text-muted)" strokeWidth={1.5} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or region..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-text-primary)', width: '100%' }} />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="input" style={{ width: 140, height: 36, paddingLeft: 12, fontSize: 13, paddingRight: 30 }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All status' : s}</option>)}
          </select>
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)', fontSize: 12 }}>▾</div>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--color-red)', fontSize: 13 }}>
          {apiError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" />
        </div>
      )}

      {/* Cards grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((p) => (
            <div key={p.id} className="card card-hover" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                    {p.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {isAdmin ? (
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        style={{
                          background: 'var(--color-surface)',
                          color: p.status === 'Active' ? 'var(--color-green)' : p.status === 'In Progress' ? 'var(--color-amber)' : 'var(--color-red)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 6px',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="Active">Active</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Ended">Ended</option>
                      </select>
                    ) : (
                      <StatusBadge status={p.status} />
                    )}
                  </div>
                </div>

                {/* Region */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                  <MapPin size={12} color="var(--color-text-muted)" strokeWidth={1.5} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{p.region}</span>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Trees size={14} color="var(--color-green)" strokeWidth={1.5} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-green)' }}>Carbon {p.carbon}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Activity size={14} color="var(--color-blue)" strokeWidth={1.5} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-blue)' }}>Bio {p.biodiversity}%</span>
                  </div>
                </div>

                {/* Site count */}
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  {p.siteCount} site{p.siteCount !== 1 ? 's' : ''} mapped
                </div>

                {/* Date */}
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 14 }}>
                  Updated {p.lastUpdated}
                </div>
              </div>

              <div>
                {/* Divider */}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '0 0 14px' }} />

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {isAdmin ? (
                    <button onClick={() => handleDeleteProject(p)} className="btn btn-ghost" style={{ height: 30, fontSize: 12, gap: 5, color: '#ef4444' }}>
                      <Trash2 size={13} strokeWidth={1.5} />
                      Delete
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Read-only
                    </span>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
              <FolderOpen size={28} strokeWidth={1.5} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>No projects match your search</div>
            </div>
          )}
        </div>
      )}

      {/* ─── Create Project Modal ─────────────────────────────────── */}
      {isCreateOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            width: '100%', maxWidth: 500,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: '90vh',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
                New project
              </span>
              <button onClick={() => setIsCreateOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleCreateProject} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: 20, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ModalField label="Project name">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="e.g. Amazon Rainforest Reforestation" required />
                </ModalField>
                <ModalField label="Country">
                  <input value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="input" placeholder="e.g. India" />
                </ModalField>
                <ModalField label="State / Region (auto-filled on map click)">
                  <input value={newStateName} onChange={(e) => setNewStateName(e.target.value)} className="input" placeholder="Will auto-fill after map click" />
                </ModalField>
                <ModalField label="Pick location on map">
                  <div ref={mapPickerRef} style={{ width: '100%', height: 200, borderRadius: 8, border: '1px solid var(--color-border)', overflow: 'hidden' }} />
                  {selectedCoords && (
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
                      {selectedCoords[1].toFixed(5)}, {selectedCoords[0].toFixed(5)}
                    </div>
                  )}
                  {mapPickerError && <div style={{ fontSize: 12, color: 'var(--color-red)', marginTop: 4 }}>{mapPickerError}</div>}
                </ModalField>
                <ModalField label="Notes (optional)">
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="input" style={{ height: 72, padding: '10px 12px' }} placeholder="Optional" />
                </ModalField>
              </div>

              {/* Modal footer */}
              <div style={{ display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newName.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                  {creating ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

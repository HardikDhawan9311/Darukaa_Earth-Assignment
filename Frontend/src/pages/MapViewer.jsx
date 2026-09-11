import React, { useEffect, useState } from 'react';
import MapboxContainer from '../components/dashboard/MapboxContainer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-assignment.onrender.com';
const DEFAULT_COORDS = [78.9629, 22.5937];

function parseProject(project) {
  let parsed = {};
  try { parsed = project?.description ? JSON.parse(project.description) : {}; } catch { parsed = {}; }
  const center = Array.isArray(parsed?.center) && parsed.center.length === 2 ? parsed.center : DEFAULT_COORDS;
  return {
    id: project.id, name: project.name, coords: center,
    region: [parsed?.state, parsed?.country].filter(Boolean).join(', ') || '—',
    carbon: 0, biodiversity: 0,
    lastUpdated: project.created_at ? new Date(project.created_at).toLocaleDateString('en-GB') : '—',
  };
}

// Panel card container
const FloatingCard = ({ children, style }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    ...style,
  }}>
    {children}
  </div>
);

const MapViewer = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [siteName, setSiteName] = useState('');
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewerProjects, setViewerProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [draftPointCount, setDraftPointCount] = useState(0);
  const [completeDrawingTrigger, setCompleteDrawingTrigger] = useState(0);

  /* Load projects */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`);
        const data = res.ok ? await res.json() : [];
        if (!cancelled) {
          const parsed = Array.isArray(data) ? data.map(parseProject) : [];
          setViewerProjects(parsed);
          if (parsed.length > 0) {
            setSelectedProject(parsed[0]);
          }
        }
      } catch (e) { if (!cancelled) setSaveError(e?.message || 'Failed to load projects'); }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Load sites */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sites`);
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setSites(Array.isArray(data) ? data : []);
      } catch (e) { if (!cancelled) setSaveError(e?.message || 'Failed to load sites'); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handlePolygonComplete(drawnRingCoords) {
    setSaveError(null);
    if (!selectedProject?.id) throw new Error('Select a project first.');
    if (!siteName.trim()) throw new Error('Enter a site name before saving.');
    if (!drawnRingCoords || drawnRingCoords.length < 3) throw new Error('Need at least 3 points.');
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: selectedProject.id, name: siteName.trim(), coordinates: drawnRingCoords }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.detail || 'Create failed'); }
      const created = await res.json();
      setSites((prev) => [...prev, created]);
      setSelectedSiteId(created?.id ?? null);
      setSiteName(''); setDrawingEnabled(false);
      return created;
    } catch (e) { setSaveError(e?.message || 'Failed'); throw e; }
    finally { setSaving(false); }
  }

  async function handleDeleteSelectedSite() {
    if (!selectedSiteId || !window.confirm('Delete selected site polygon?')) return;
    setDeleting(true); setSaveError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sites/${selectedSiteId}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.detail || 'Delete failed'); }
      setSites((prev) => prev.filter((s) => s.id !== selectedSiteId));
      setSelectedSiteId(null);
    } catch (e) { setSaveError(e?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  }

  const sitesForProject = selectedProject?.id
    ? sites.filter((s) => Number(s.project_id) === Number(selectedProject.id))
    : sites;

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  useEffect(() => {
    if (!sitesForProject.some((s) => s.id === selectedSiteId)) setSelectedSiteId(null);
  }, [sites, selectedSiteId, sitesForProject]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapboxContainer
          coords={selectedProject?.coords || DEFAULT_COORDS}
          loading={false}
          fullscreen
          enablePolygonDraw={drawingEnabled}
          onPolygonComplete={handlePolygonComplete}
          completeDrawingTrigger={completeDrawingTrigger}
          onDraftPointCountChange={setDraftPointCount}
          onDrawError={(msg) => setSaveError(msg)}
          persistedSites={sitesForProject}
          selectedSiteId={selectedSiteId}
          onSiteClick={setSelectedSiteId}
        />
      </div>

      {/* Top toolbar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20, display: 'flex', gap: 10, alignItems: 'flex-start', pointerEvents: 'none' }}>
        {/* Project selector */}
        <FloatingCard style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'all' }}>
          <select
            value={selectedProject?.id ?? ''}
            onChange={(e) => {
              const p = viewerProjects.find((p) => String(p.id) === e.target.value);
              setSelectedProject(p || null);
            }}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--color-text-primary)', fontSize: 13, fontWeight: 500,
              fontFamily: 'Inter, sans-serif', minWidth: 200, cursor: 'pointer',
            }}
          >
            <option value="">All projects</option>
            {viewerProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Draw toggle */}
          <button
            onClick={() => setDrawingEnabled((v) => !v)}
            style={{
              height: 32, padding: '0 12px', borderRadius: 8, border: `1px solid ${drawingEnabled ? 'var(--color-green)' : 'var(--color-border)'}`,
              background: drawingEnabled ? 'var(--color-green-dim)' : 'var(--color-card-raised)',
              color: drawingEnabled ? 'var(--color-green)' : 'var(--color-text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {drawingEnabled ? 'Drawing on' : 'Draw site'}
          </button>

          {/* Clear */}
          <button
            onClick={() => { setDrawingEnabled(false); setDraftPointCount(0); }}
            style={{
              height: 32, padding: '0 12px', borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-card-raised)',
              color: 'var(--color-text-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Clear
          </button>

          {/* Points badge */}
          {drawingEnabled && (
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)',
              background: 'var(--color-card-raised)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '0 10px', height: 32, display: 'flex', alignItems: 'center',
            }}>
              {draftPointCount} points
            </div>
          )}
        </FloatingCard>
      </div>

      {/* ── RIGHT SIDE PANEL ── site detail / create */}
      <FloatingCard style={{
        position: 'absolute', top: 12, right: 12, zIndex: 20,
        width: 300, maxHeight: 'calc(100% - 24px)',
        overflow: 'hidden auto', padding: 18,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
          {selectedProject ? selectedProject.name : 'Map Viewer'}
        </div>

        {!selectedProject && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Select a project to create and manage sites. Existing sites are visible on the map.
          </p>
        )}

        {selectedProject && (
          <>
            {/* Site name */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5 }}>Site name</label>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="input" style={{ height: 36, fontSize: 13 }} placeholder="e.g. Coastal Wetland Zone" />
            </div>

            {/* Site selector */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 5 }}>Select existing site</label>
              <select value={selectedSiteId ?? ''} onChange={(e) => setSelectedSiteId(Number(e.target.value))} disabled={!sitesForProject.length} className="input" style={{ height: 36, fontSize: 13 }}>
                {sitesForProject.length === 0
                  ? <option value="">No sites yet</option>
                  : sitesForProject.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>
            </div>

            {/* Selected site info */}
            {selectedSite && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--color-green-dim)', border: '1px solid var(--color-green-ring)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedSite.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>
                  ID: PLY-{String(selectedSite.id).padStart(4, '0')}
                </div>
              </div>
            )}

            {/* Error */}
            {saveError && (
              <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: 'var(--color-red)' }}>
                {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setCompleteDrawingTrigger((n) => n + 1)}
                disabled={!drawingEnabled || saving || draftPointCount < 3}
                className="btn btn-primary"
                style={{ flex: 1, height: 34, fontSize: 12 }}
              >
                {saving ? 'Saving…' : 'Complete polygon'}
              </button>
            </div>

            {drawingEnabled && (
              <button onClick={() => { setDrawingEnabled(false); setDraftPointCount(0); }} className="btn btn-ghost" style={{ height: 34, fontSize: 12 }}>
                Undo / cancel
              </button>
            )}

            {selectedSiteId && (
              <button onClick={handleDeleteSelectedSite} disabled={deleting} className="btn btn-danger" style={{ height: 34, fontSize: 12 }}>
                {deleting ? 'Deleting…' : 'Delete selected site'}
              </button>
            )}
          </>
        )}
      </FloatingCard>



      {/* ── BOTTOM TOOLBAR ── when drawing */}
      {drawingEnabled && (
        <FloatingCard style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button
            onClick={() => setCompleteDrawingTrigger((n) => n + 1)}
            disabled={draftPointCount < 3 || saving}
            className="btn btn-primary"
            style={{ height: 34, fontSize: 13 }}
          >
            {saving ? 'Saving…' : 'Complete polygon'}
          </button>
          <button
            onClick={() => { setDrawingEnabled(false); setDraftPointCount(0); }}
            className="btn btn-ghost"
            style={{ height: 34, fontSize: 13 }}
          >
            Undo last point
          </button>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-card-raised)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0 10px', height: 34, display: 'flex', alignItems: 'center' }}>
            {draftPointCount} of {draftPointCount} points
          </div>
        </FloatingCard>
      )}

      {/* ── PROJECTS LIST — left collapsible ── */}
      {panelOpen && (
        <FloatingCard style={{
          position: 'absolute', top: 60, left: 12, zIndex: 20,
          width: 240, maxHeight: 'calc(100% - 130px)',
          overflow: 'hidden auto',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {viewerProjects.length} project{viewerProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          {viewerProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject((prev) => prev?.id === p.id ? null : p)}
              style={{
                width: '100%', textAlign: 'left',
                border: 'none', borderBottom: '1px solid var(--color-border)',
                borderLeft: selectedProject?.id === p.id ? '2px solid var(--color-green)' : '2px solid transparent',
                padding: '12px 14px', cursor: 'pointer',
                background: selectedProject?.id === p.id ? 'var(--color-green-glow)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (selectedProject?.id !== p.id) e.currentTarget.style.background = 'var(--color-card-raised)'; }}
              onMouseLeave={(e) => { if (selectedProject?.id !== p.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{p.region}</div>
            </button>
          ))}
        </FloatingCard>
      )}

      {/* Panel toggle */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        style={{
          position: 'absolute', top: 62, left: panelOpen ? 264 : 12, zIndex: 21,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)', fontSize: 12, transition: 'left 0.2s',
        }}
      >
        {panelOpen ? '◀' : '▶'}
      </button>
    </div>
  );
};

export default MapViewer;

import React from 'react';
import { MapPin, Trees, Activity, TrendingUp } from 'lucide-react';

const ProjectCard = ({ project, isSelected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '14px 16px',
      borderBottom: '1px solid var(--color-border)',
      borderTop: 'none', borderRight: 'none',
      borderLeft: isSelected ? '2px solid var(--color-green)' : '2px solid transparent',
      background: isSelected ? 'var(--color-green-glow)' : 'transparent',
      cursor: 'pointer',
      transition: 'background 0.12s, border-color 0.12s',
    }}
    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--color-card-raised)'; }}
    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
  >
    {/* Top row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3, textAlign: 'left' }}>
        {project.name}
      </span>
      <span className={project.status === 'In Progress' ? 'badge-amber' : project.status === 'Ended' ? 'badge-red' : 'badge-green'} style={{ fontSize: 10, padding: '2px 8px', flexShrink: 0, marginLeft: 8 }}>
        {project.status || 'Active'}
      </span>
    </div>

    {/* Region */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
      <MapPin size={12} color="var(--color-text-muted)" strokeWidth={1.5} />
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{project.region || '—'}</span>
    </div>

    {/* Metrics */}
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Trees size={14} color="var(--color-green)" strokeWidth={1.5} />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-green)' }}>
          Carbon {project.carbon ?? 0}%
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Activity size={14} color="var(--color-blue)" strokeWidth={1.5} />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-blue)' }}>
          Bio {project.biodiversity ?? 0}%
        </span>
      </div>
    </div>

    {/* Selected footer */}
    {isSelected && (
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <TrendingUp size={11} color="var(--color-green)" strokeWidth={1.5} />
        <span style={{ fontSize: 11, color: 'var(--color-green)', fontFamily: 'JetBrains Mono, monospace' }}>
          {project.lastUpdated}
        </span>
      </div>
    )}
  </button>
);

export default ProjectCard;

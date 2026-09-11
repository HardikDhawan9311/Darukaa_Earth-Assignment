import React from 'react';
import { ChevronRight, Globe } from 'lucide-react';

const PAGE_TITLES = {
  '/admin/dashboard': 'Overview',
  '/admin/projects':  'Projects',
  '/admin/map':       'Map',
  '/admin/analytics': 'Analytics',
};

const TopNavbar = ({ user, pathname = '' }) => {
  const title = PAGE_TITLES[pathname] || 'Overview';

  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Globe size={16} color="var(--color-green)" strokeWidth={1.5} />
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Earth Platform</span>
        <ChevronRight size={14} color="var(--color-text-muted)" strokeWidth={1.5} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </span>
      </div>
    </header>
  );
};

export default TopNavbar;

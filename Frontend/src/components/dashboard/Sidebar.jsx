import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Globe, FolderOpen, Map as MapIcon, BarChart2, LogOut,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

const NAV_ITEMS = [
  { label: 'Overview',  icon: Globe,       to: '/admin/dashboard' },
  { label: 'Projects',  icon: FolderOpen,  to: '/admin/projects'  },
  { label: 'Map',       icon: MapIcon,     to: '/admin/map'       },
  { label: 'Analytics', icon: BarChart2,   to: '/admin/analytics' },
];

const Sidebar = ({ onLogout }) => {
  const user = (() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  })();

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'A';
  const displayName = user.email ? user.email.split('@')[0] : 'Analyst User';

  return (
    <aside style={{
      width: 260,
      flexShrink: 0,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <BrandLogo size="large" />
      </div>

      {/* Nav */}
      <div style={{ padding: '20px 14px', flex: 1, overflowY: 'auto' }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11,
          color: 'var(--color-text-muted)', letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '0 10px', marginBottom: 10,
        }}>
          Platform Navigation
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{ height: 42, padding: '0 14px', fontSize: 14, gap: 12 }}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Card & Sign out */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* User Card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--color-card-raised)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--color-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {displayName}
            </div>

          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={onLogout}
          className="nav-item"
          style={{ color: 'var(--color-text-muted)', height: 38, padding: '0 12px', fontSize: 13, gap: 10 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-red)';
            e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import TopNavbar from '../dashboard/TopNavbar';

const DashboardLayout = () => {
  const [user] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    setTimeout(() => navigate('/login', { replace: true }), 0);
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-base)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-base)', overflow: 'hidden' }}>
      <Sidebar onLogout={handleLogout} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopNavbar user={user} pathname={location.pathname} />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

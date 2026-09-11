import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login         from './pages/Login';
import Register      from './pages/Register';

import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard  from './pages/AdminDashboard';
import ProjectsPage    from './pages/ProjectsPage';
import MapViewer       from './pages/MapViewer';
import AnalyticsPage   from './pages/AnalyticsPage';

function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        {/* Protected admin routes — share DashboardLayout */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="projects"  element={<ProjectsPage />}  />
          <Route path="map"       element={<MapViewer />}     />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Legacy redirect for direct /admin/dashboard links */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

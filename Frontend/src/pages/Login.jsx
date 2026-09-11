import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InteractiveGlobe from '../components/dashboard/InteractiveGlobe';
import BrandLogo from '../components/common/BrandLogo';

const Login = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-assignment.onrender.com';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        toast.success(`Welcome back, ${data.full_name || data.fullName || 'User'}!`);
        navigate('/admin/dashboard');
      } else {
        toast.error(data.detail || 'Login failed');
      }
    } catch {
      toast.error('Cannot reach server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-base)',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── Left panel — Live 3D Globe & Branding ── */}
      <div style={{
        flex: 1,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '36px 48px 24px',
      }}>


        {/* Center Live 3D Globe */}
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 380,
        }}>
          <InteractiveGlobe />
        </div>


      </div>

      {/* ── Right panel — Form ── */}
      <div style={{
        width: 520,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 64px',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 360, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <BrandLogo size="xlarge" />
          </div>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, fontSize: 28,
            color: 'var(--color-text-primary)',
            marginBottom: 8,
          }}>
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
            Access your geospatial carbon dashboard
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--color-text-muted)" strokeWidth={1.5}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange} required
                  placeholder="you@organization.com"
                  className="input with-icon-left"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--color-text-muted)" strokeWidth={1.5}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange} required
                  placeholder="••••••••••"
                  className="input with-icon-left with-icon-right"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                Forgot password?
              </span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 600 }}>
              {loading ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '24px 0' }} />

          {/* Register link */}
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
              Create account
            </Link>
          </p>


        </div>
      </div>
    </div>
  );
};

export default Login;

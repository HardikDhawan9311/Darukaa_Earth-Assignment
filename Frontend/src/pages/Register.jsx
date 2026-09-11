import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InteractiveGlobe from '../components/dashboard/InteractiveGlobe';
import BrandLogo from '../components/common/BrandLogo';

const Register = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://darukaa-earth-backend.onrender.com';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'user' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          full_name: form.fullName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Account created! Welcome, ${form.fullName}.`);
        setTimeout(() => navigate('/login'), 1200);
      } else {
        toast.error(data.detail || 'Registration failed');
      }
    } catch {
      toast.error('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { position: 'relative' };
  const iconStyle = {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)', pointerEvents: 'none',
    color: 'var(--color-text-muted)',
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
        width: 540,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 64px',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: 20 }}>
            <BrandLogo size="xlarge" />
          </div>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, fontSize: 26,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}>
            Create account
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
            Join the Darukaa environmental intelligence network
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Full Name</label>
              <div style={fieldStyle}>
                <User size={16} strokeWidth={1.5} style={iconStyle} />
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Jane Okonkwo" className="input with-icon-left" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Email address</label>
              <div style={fieldStyle}>
                <Mail size={16} strokeWidth={1.5} style={iconStyle} />
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@organization.com" className="input with-icon-left" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Password</label>
              <div style={fieldStyle}>
                <Lock size={16} strokeWidth={1.5} style={iconStyle} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required placeholder="Min. 8 characters" className="input with-icon-left with-icon-right" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Confirm Password</label>
              <div style={fieldStyle}>
                <Lock size={16} strokeWidth={1.5} style={iconStyle} />
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required placeholder="Repeat password" className="input with-icon-left" />
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Account Role</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} strokeWidth={1.5} style={iconStyle} />
                <select name="role" value={form.role} onChange={handleChange} className="input with-icon-left" style={{ cursor: 'pointer' }}>
                  <option value="user">Environmental Analyst</option>
                  <option value="admin">Platform Administrator</option>
                </select>
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }}>▾</div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 600, marginTop: 6 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '20px 0' }} />

          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-green)', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

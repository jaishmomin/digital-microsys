import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

const Register = () => {
  const { theme } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', rollNumber: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fName, setFName] = useState(false);
  const [fRoll, setFRoll] = useState(false);
  const [fEmail, setFEmail] = useState(false);
  const [fPw, setFPw] = useState(false);
  const [fCPw, setFCPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.rollNumber || !form.email || !form.password) {
      return toast.error('Please fill all fields');
    }
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await register({ name: form.name, rollNumber: form.rollNumber, email: form.email, password: form.password });
      toast.success('Account created!');
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const inputStyle = (focused) => ({
    width: '100%',
    padding: '13px 16px',
    background: theme === 'light' ? '#f8faff' : 'rgba(255,255,255,0.05)',
    border: focused 
      ? '1.5px solid var(--accent-blue)' 
      : (theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)'),
    borderRadius: '10px',
    color: theme === 'light' ? '#0f172a' : '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease'
  });

  const labelStyle = {
    color: theme === 'light' ? '#374151' : 'var(--text-label)',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'block'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fade-in" style={{
        background: theme === 'light' ? '#ffffff' : 'var(--bg-surface)',
        border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid var(--border-color)',
        borderRadius: 20, padding: 40, width: '100%', maxWidth: 420,
        boxShadow: theme === 'light' ? '0 8px 40px rgba(0,0,0,0.10)' : 'none'
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'var(--accent-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 24,
        }}>✏️</div>

        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', marginBottom: 6 }}>
          Create Account
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>
          Register as a student on Digital Microsys
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Full Name</label>
            <input placeholder="John Doe" value={form.name} onChange={set('name')}
                   onFocus={() => setFName(true)} onBlur={() => setFName(false)} style={inputStyle(fName)} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Roll Number</label>
            <input placeholder="2024CS001" value={form.rollNumber} onChange={set('rollNumber')}
                   onFocus={() => setFRoll(true)} onBlur={() => setFRoll(false)} style={inputStyle(fRoll)} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')}
                   onFocus={() => setFEmail(true)} onBlur={() => setFEmail(false)} style={inputStyle(fEmail)} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters" value={form.password} onChange={set('password')}
                     onFocus={() => setFPw(true)} onBlur={() => setFPw(false)} style={inputStyle(fPw)} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                background: theme === 'light' ? '#f8faff' : 'var(--bg-hover)', 
                border: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid var(--border-input)',
                borderRadius: 10, width: 48, flexShrink: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', transition: 'color 0.2s',
              }}>
                {showPw ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type={showCPw ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')}
                     onFocus={() => setFCPw(true)} onBlur={() => setFCPw(false)} style={inputStyle(fCPw)} />
              <button type="button" onClick={() => setShowCPw(!showCPw)} style={{
                background: theme === 'light' ? '#f8faff' : 'var(--bg-hover)', 
                border: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid var(--border-input)',
                borderRadius: 10, width: 48, flexShrink: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', transition: 'color 0.2s',
              }}>
                {showCPw ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="dms-btn dms-btn-primary dms-btn-full" style={{ padding: 14 }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

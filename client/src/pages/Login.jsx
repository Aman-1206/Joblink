import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function GoogleSignInButton({ role }) {
  if (role !== 'student') return null;
  const handleGoogle = () => {
    window.location.href = '/api/auth/google';
  };
  return (
    <button
      type="button"
      onClick={handleGoogle}
      style={{
        width: '100%',
        padding: '0.75rem',
        marginTop: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: '0.9375rem',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    </button>
  );
}

export default function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      localStorage.setItem('token', data.token);
      if (data.user.role === 'admin') navigate('/admin/dashboard');
      else if (data.user.role === 'hr') navigate('/hr/dashboard');
      else navigate('/jobs');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', position: 'relative' }}>
      {/* Left - Student */}
      <Link
        to="/login"
        onClick={(e) => { e.preventDefault(); setRole('student'); }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: 'white',
          textDecoration: 'none',
          padding: '2rem',
          position: 'relative',
          opacity: role === 'student' ? 1 : 0.9,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'40\' fill=\'none\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'1\'/%3E%3C/svg%3E")', opacity: 0.5 }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sign In as Student</h2>
          <p style={{ opacity: 0.9 }}>Find Internships & Jobs</p>
          <p style={{ marginTop: '2rem', fontSize: '0.875rem', opacity: 0.8 }}>Click to sign in</p>
        </div>
      </Link>

      {/* Right - HR */}
      <Link
        to="/login"
        onClick={(e) => { e.preventDefault(); setRole('hr'); }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
          color: 'white',
          textDecoration: 'none',
          padding: '2rem',
          position: 'relative',
          opacity: role === 'hr' ? 1 : 0.9,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'40\' fill=\'none\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'1\'/%3E%3C/svg%3E")', opacity: 0.5 }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sign In as HR</h2>
          <p style={{ opacity: 0.9 }}>Hire Top Talent</p>
          <p style={{ marginTop: '2rem', fontSize: '0.875rem', opacity: 0.8 }}>Click to sign in</p>
        </div>
      </Link>

      {/* Overlay form - centered */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: 420,
        zIndex: 10,
      }}>
        <div className="card" style={{ padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <h3 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
            {role === 'student' ? 'Sign In as Student' : 'Sign In as HR'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            {role === 'student' ? 'Find internships and jobs' : 'Hire top talent'}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label>I am</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student / Job Seeker</option>
                <option value="hr">HR / Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Sign In
            </button>
            <GoogleSignInButton role={role} />
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

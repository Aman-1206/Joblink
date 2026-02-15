import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

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
          </form>
          <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

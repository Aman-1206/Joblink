import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (role === 'student') {
        const { data } = await api.post('/auth/register/student', { email, password, fullName });
        localStorage.setItem('token', data.token);
        navigate('/jobs');
      } else {
        const res = await api.post('/auth/register/hr', {
          email,
          password,
          fullName,
          phone,
          companyName,
        });
        if (res.status === 202) {
          setSuccess(res.data.message);
          setEmail('');
          setPassword('');
          setFullName('');
          setPhone('');
          setCompanyName('');
        } else {
          localStorage.setItem('token', res.data.token);
          navigate('/hr/dashboard');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Create account</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          Join JobLink as a job seeker or recruiter
        </p>

        {role === 'hr' && (
          <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
              <strong>Verify Your Company Email</strong><br />
              Use your official company email (e.g. hr@google.com). If your domain isn't in our database, your request will be sent for admin approval.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>I am a</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student / Job Seeker</option>
              <option value="hr">HR / Recruiter</option>
            </select>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'hr' ? 'hr@company.com' : 'you@example.com'}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {role === 'hr' && (
            <>
              <div className="form-group">
                <label>Phone (optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
              </div>
              <div className="form-group">
                <label>Company Name (optional)</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company" />
              </div>
            </>
          )}

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            {role === 'hr' ? 'Continue' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

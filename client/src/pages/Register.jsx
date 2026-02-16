import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await api.post('/auth/send-otp', { email, role });
      setSuccess('OTP sent to your email. Check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const payload = { email, otp, password, fullName, role };
      if (role === 'hr') Object.assign(payload, { phone, companyName, gstNumber });
      const res = await api.post('/auth/verify-otp-register', payload);
      if (res.status === 202) {
        setSuccess(res.data.message);
        setStep(1);
        setOtp('');
        setPassword('');
      } else {
        localStorage.setItem('token', res.data.token);
        if (res.data.user?.role === 'hr') navigate('/hr/dashboard');
        else navigate('/jobs');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const backToStep1 = () => {
    setStep(1);
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="container" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Create account</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          Join JobLink as a job seeker or recruiter
        </p>

        {role === 'hr' && step === 1 && (
          <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
              <strong>Verify Your Company Email</strong><br />
              Use your official company email (e.g. hr@google.com). If your domain isn't in our database, your request will be sent for admin approval.
            </p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>I am a</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student / Job Seeker</option>
                <option value="hr">HR / Recruiter</option>
              </select>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
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
                <div className="form-group">
                  <label>GST Number</label>
                  <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 22AAAAA0000A1Z5" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Admin will verify your company's GST number</p>
                </div>
              </>
            )}
            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={sending}>
              {sending ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
            </p>
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
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
            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              onClick={backToStep1}
            >
              Back
            </button>
          </form>
        )}

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

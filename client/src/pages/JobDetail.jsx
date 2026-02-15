import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const [hasApplied, setHasApplied] = useState(false);
  useEffect(() => {
    if (user?.role === 'student' && id) {
      api.get('/applications/my')
        .then(res => setHasApplied((res.data || []).some(a => a.job_id === Number(id))))
        .catch(() => setHasApplied(false));
    } else {
      setHasApplied(false);
    }
  }, [user, id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('jobId', id);
      formData.append('coverLetter', coverLetter);
      if (resume) formData.append('resume', resume);

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');

      navigate('/my-applications');
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        {loading ? 'Loading...' : 'Job not found'}
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{job.title}</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {job.hr_company || job.company_name} · {job.location || 'Remote'} · {job.type || 'Full-time'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Job Description</h3>
        <div style={{ whiteSpace: 'pre-wrap' }}>{job.description || 'No description provided.'}</div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Apply for this job</h3>
        {user?.role === 'student' && hasApplied ? (
          <p style={{ color: 'var(--success)', fontWeight: 500 }}>You have already applied for this job.</p>
        ) : user?.role === 'student' ? (
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Cover Letter (optional)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the employer why you're a great fit..."
              />
            </div>
            <div className="form-group">
              <label>Resume (PDF, JPG, PNG - max 5MB)</label>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => setResume(e.target.files?.[0])}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={applying}>
              {applying ? 'Applying...' : 'Submit Application'}
            </button>
          </form>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>
            You need to be logged in as a student to apply.{' '}
            <Link to="/login">Sign in</Link> or <Link to="/register">create an account</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

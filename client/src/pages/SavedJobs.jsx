import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/saved-jobs/list')
      .then(res => setJobs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const unsave = async (jobId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/saved-jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Saved Jobs</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
        {jobs.length} saved job{jobs.length !== 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't saved any jobs yet.</p>
            <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to={`/jobs/${job.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(job.hr_company || job.company_name || 'J')[0]}
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem', fontSize: '1.125rem' }}>{job.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                      {job.hr_company || job.company_name} · {job.location || 'Remote'} · {job.type || 'Full-time'}
                    </p>
                  </div>
                </div>
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to={`/jobs/${job.id}`} className="btn btn-primary">View</Link>
                <button
                  type="button"
                  onClick={(e) => unsave(job.id, e)}
                  className="btn btn-secondary"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

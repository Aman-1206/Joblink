import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    api.get('/jobs')
      .then(res => setJobs(res.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      api.get('/applications/my')
        .then(res => setAppliedIds(new Set((res.data || []).map(a => a.job_id))))
        .catch(() => setAppliedIds(new Set()));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      api.get('/saved-jobs')
        .then(res => setSavedIds(new Set(Array.isArray(res.data) ? res.data : [])))
        .catch(() => setSavedIds(new Set()));
    }
  }, [user]);

  const toggleSave = async (jobId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const isSaved = savedIds.has(Number(jobId));
    try {
      if (isSaved) {
        await api.delete(`/saved-jobs/${jobId}`);
        setSavedIds(prev => { const n = new Set(prev); n.delete(Number(jobId)); return n; });
      } else {
        await api.post(`/saved-jobs/${jobId}`, {});
        setSavedIds(prev => new Set([...prev, Number(jobId)]));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>Loading jobs...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Student Job Feed</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
        {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No jobs posted yet. Check back later!</p>
          </div>
        ) : (
          jobs.map((job) => {
            const applied = user?.role === 'student' && appliedIds.has(job.id);
            const saved = user && savedIds.has(job.id);
            return (
              <div key={job.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
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
                      {job.hr_company || job.company_name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      {job.location || 'Remote'} · {job.type || 'Full-time'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {applied ? (
                    <span style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: 500 }}>
                      Already applied
                    </span>
                  ) : (
                    <Link
                      to={`/jobs/${job.id}`}
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Apply Now →
                    </Link>
                  )}
                  {user ? (
                    <button
                      type="button"
                      onClick={(e) => toggleSave(job.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: saved ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        fontWeight: saved ? 600 : 400,
                      }}
                    >
                      {saved ? 'Saved' : 'Save'}
                    </button>
                  ) : (
                    <Link to="/login" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Save</Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

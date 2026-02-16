import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
    api.get(`/applications/my${q}`)
      .then(res => setApps(res.data || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const withdraw = async (appId, e) => {
    e?.preventDefault();
    if (!window.confirm('Withdraw this application?')) return;
    try {
      await api.delete(`/applications/${appId}`);
      setApps(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      alert(err.message);
    }
  };

  const pending = apps.filter(a => a.status === 'pending');
  const accepted = apps.filter(a => a.status === 'accepted');
  const rejected = apps.filter(a => a.status === 'rejected');

  const statusStyle = (s) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    background: s === 'pending' ? 'var(--warning-light)' : s === 'accepted' ? 'var(--success-light)' : 'var(--danger-light)',
    color: s === 'pending' ? 'var(--warning)' : s === 'accepted' ? 'var(--success)' : 'var(--danger)',
  });

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '0.5rem' }}>Application Status</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Track all your job applications and their status
      </p>
      {apps.length > 0 && (
        <input
          type="search"
          placeholder="Search by job title, company, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: '1.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', width: '100%', maxWidth: 360 }}
        />
      )}

      {apps.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>{apps.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Applications</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{pending.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{accepted.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Accepted</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{rejected.length}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Rejected</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {apps.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't applied to any jobs yet.</p>
            <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          apps.map((app) => (
            <div key={app.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <Link to={`/jobs/${app.job_id}`} style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    {app.title}
                  </Link>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                    {app.company_name} · Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={statusStyle(app.status)}>{app.status}</span>
                  <button onClick={(e) => withdraw(app.id, e)} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}>
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [domains, setDomains] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('analytics');
  const [newDomain, setNewDomain] = useState({ domain: '', companyName: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', fullName: '' });
  const [domainError, setDomainError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  useEffect(() => { load(); }, [tab]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/pending-hr').then(r => r.data).catch(() => []),
      api.get('/admin/company-domains').then(r => r.data).catch(() => []),
      api.get('/admin/analytics').then(r => r.data).catch(() => null),
      api.get('/admin/jobs').then(r => r.data).catch(() => []),
    ]).then(([p, d, a, j]) => {
      setPending(p);
      setDomains(d);
      setAnalytics(a);
      setJobs(j);
    }).finally(() => setLoading(false));
  };

  const approve = async (id) => {
    try { await api.post(`/admin/approve-hr/${id}`); load(); } catch (e) { alert(e.message); }
  };
  const reject = async (id) => {
    try { await api.post(`/admin/reject-hr/${id}`); load(); } catch (e) { alert(e.message); }
  };
  const deleteJob = async (id, title) => {
    if (!window.confirm(`Delete job "${title}"? This will also delete all applications.`)) return;
    try { await api.delete(`/admin/jobs/${id}`); load(); } catch (e) { alert(e.message); }
  };
  const addDomain = async (e) => {
    e.preventDefault();
    setDomainError('');
    try { await api.post('/admin/company-domains', newDomain); setNewDomain({ domain: '', companyName: '' }); load(); } catch (err) { setDomainError(err.message); }
  };
  const addAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');
    try { await api.post('/admin/add-admin', newAdmin); setNewAdmin({ email: '', password: '', fullName: '' }); setAdminSuccess('Admin added successfully'); load(); } catch (err) { setAdminError(err.message); }
  };

  const navItems = [
    { id: 'analytics', label: 'Total Companies', icon: '📊' },
    { id: 'approvals', label: 'Admin Approval Queue', icon: '✓' },
    { id: 'jobs', label: 'View Jobs', icon: '💼' },
    { id: 'domains', label: 'Manage HR Domains', icon: '🌐' },
    { id: 'admins', label: 'Add New Admins', icon: '👤' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '1rem 0',
        height: 'fit-content',
        position: 'sticky',
        top: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', marginBottom: '1rem' }}>
          <MenuIcon />
          <span style={{ fontWeight: 700 }}>Adminb</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="btn"
              style={{
                justifyContent: 'flex-start',
                background: tab === item.id ? 'var(--accent-light)' : 'transparent',
                color: tab === item.id ? 'var(--accent)' : 'var(--text)',
                border: 'none',
                borderRadius: 0,
                padding: '0.75rem 1rem',
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Admin</span>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>
            {tab === 'analytics' && 'Total Companies'}
            {tab === 'approvals' && 'Admin Approval Queue'}
            {tab === 'jobs' && 'View Jobs'}
            {tab === 'domains' && 'Manage HR Domains'}
            {tab === 'admins' && 'Add New Admins'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            {tab === 'approvals' && 'Verify or reject pending HR registrations.'}
            {tab === 'domains' && 'Approve domains and add new ones.'}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : tab === 'analytics' && analytics ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div className="card stat-card-blue" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none' }}>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.companies}</p>
              <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Companies</p>
            </div>
            <div className="card stat-card-green" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none' }}>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.hrCount}</p>
              <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>HRs</p>
            </div>
            <div className="card stat-card-orange" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none' }}>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.studentCount}</p>
              <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Students</p>
            </div>
            <div className="card stat-card-red" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none' }}>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.jobCount}</p>
              <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Jobs</p>
            </div>
          </div>
        ) : tab === 'approvals' ? (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Company</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No pending HR requests.</td></tr>
                ) : (
                  pending.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>{p.company_name || '—'}</td>
                      <td style={{ padding: '0.75rem' }}>{p.email}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button onClick={() => approve(p.id)} className="btn btn-primary" style={{ marginRight: '0.5rem' }}>Verify</button>
                        <button onClick={() => reject(p.id)} className="btn btn-danger">Reject</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'jobs' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No jobs posted yet.</div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{job.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{job.company_name || job.hr_company} · {job.application_count || 0} applications</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/jobs/${job.id}`} className="btn btn-secondary">View</Link>
                    <button onClick={() => deleteJob(job.id, job.title)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === 'domains' ? (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Approved Domains</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>e.g. @google.com</p>
            </div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Add New Domain</h4>
              <form onSubmit={addDomain} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>Domain</label>
                  <input value={newDomain.domain} onChange={(e) => setNewDomain(d => ({ ...d, domain: e.target.value }))} placeholder="company.com" />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 180 }}>
                  <label>Company Name</label>
                  <input value={newDomain.companyName} onChange={(e) => setNewDomain(d => ({ ...d, companyName: e.target.value }))} placeholder="Company Inc" />
                </div>
                <button type="submit" className="btn btn-primary">Add Domain</button>
              </form>
              {domainError && <p className="error-msg" style={{ marginTop: '0.5rem' }}>{domainError}</p>}
            </div>
            <h4 style={{ marginBottom: '0.75rem' }}>All Domains ({domains.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {domains.map((d) => (
                <div key={d.id} className="card" style={{ padding: '0.75rem' }}>
                  <p style={{ fontWeight: 600 }}>{d.company_name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{`@${d.domain}`}</p>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 'admins' ? (
          <div className="card" style={{ maxWidth: 400 }}>
            <form onSubmit={addAdmin}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin(a => ({ ...a, email: e.target.value }))} placeholder="admin@company.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin(a => ({ ...a, password: e.target.value }))} placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label>Full Name (optional)</label>
                <input value={newAdmin.fullName} onChange={(e) => setNewAdmin(a => ({ ...a, fullName: e.target.value }))} placeholder="Admin Name" />
              </div>
              {adminError && <p className="error-msg">{adminError}</p>}
              {adminSuccess && <p className="success-msg">{adminSuccess}</p>}
              <button type="submit" className="btn btn-primary">Add Admin</button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

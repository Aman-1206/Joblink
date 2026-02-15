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
  const [reports, setReports] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('analytics');
  const [newDomain, setNewDomain] = useState({ domain: '', companyName: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', fullName: '' });
  const [domainError, setDomainError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/pending-hr').then(r => r.data).catch(() => []),
      api.get('/admin/company-domains').then(r => r.data).catch(() => []),
      api.get('/admin/analytics').then(r => r.data).catch(() => null),
      api.get('/admin/jobs').then(r => r.data).catch(() => []),
      api.get('/admin/reports').then(r => r.data).catch(() => []),
      api.get('/admin/hrs').then(r => r.data).catch(() => []),
      api.get('/admin/students').then(r => r.data).catch(() => []),
      api.get('/admin/companies').then(r => r.data).catch(() => []),
    ]).then(([p, d, a, j, r, h, s, c]) => {
      setPending(p);
      setDomains(d);
      setAnalytics(a);
      setJobs(j);
      setReports(r);
      setHrs(h);
      setStudents(s);
      setCompanies(c);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const approve = async (id) => {
    try { await api.post(`/admin/approve-hr/${id}`); load(); } catch (e) { alert(e.message); }
  };
  const reject = async (id) => {
    try { await api.post(`/admin/reject-hr/${id}`); load(); } catch (e) { alert(e.message); }
  };
  const deleteJob = async (id, title) => {
    if (!window.confirm(`Delete job "${title}"? This will also delete all applications and reports.`)) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      load();
    } catch (e) { alert(e.message); }
  };
  const dismissReport = async (id) => {
    try { await api.delete(`/admin/reports/${id}`); load(); } catch (e) { alert(e.message); }
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
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'approvals', label: 'Admin Approval Queue', icon: '✓' },
    { id: 'reports', label: 'Reported Jobs', icon: '⚠️' },
    { id: 'jobs', label: 'View Jobs', icon: '💼' },
    { id: 'domains', label: 'Manage HR Domains', icon: '🌐' },
    { id: 'admins', label: 'Add New Admins', icon: '👤' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <aside style={{ width: 220, flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 0', height: 'fit-content', position: 'sticky', top: '1rem' }}>
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
              style={{ justifyContent: 'flex-start', background: tab === item.id ? 'var(--accent-light)' : 'transparent', color: tab === item.id ? 'var(--accent)' : 'var(--text)', border: 'none', borderRadius: 0, padding: '0.75rem 1rem' }}
            >
              {item.icon} {item.label} {item.id === 'reports' && reports.length > 0 && `(${reports.length})`}
            </button>
          ))}
        </nav>
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Admin</span>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>
            {tab === 'analytics' && 'Analytics'}
            {tab === 'approvals' && 'Admin Approval Queue'}
            {tab === 'reports' && 'Reported Jobs'}
            {tab === 'jobs' && 'View Jobs'}
            {tab === 'companies' && 'Organizations'}
            {tab === 'hrs' && 'HRs'}
            {tab === 'students' && 'Students'}
            {tab === 'domains' && 'Manage HR Domains'}
            {tab === 'admins' && 'Add New Admins'}
          </h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : tab === 'analytics' && analytics ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <button onClick={() => setTab('companies')} className="card stat-card-blue" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.companies}</p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Organizations</p>
              </button>
              <button onClick={() => setTab('hrs')} className="card stat-card-green" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.hrCount}</p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>HRs</p>
              </button>
              <button onClick={() => setTab('students')} className="card stat-card-orange" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.studentCount}</p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Students</p>
              </button>
              <button onClick={() => setTab('jobs')} className="card stat-card-red" style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.jobCount}</p>
                <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Jobs</p>
              </button>
            </div>
          </div>
        ) : tab === 'reports' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No reported jobs.</div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="card">
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>{r.job_title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}><strong>Company:</strong> {r.company_name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}><strong>Posted by HR:</strong> {r.hr_name || r.hr_email} ({r.hr_email})</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}><strong>Reported by:</strong> {r.reporter_name || r.reporter_email} ({r.reporter_email})</p>
                    <p style={{ marginTop: '0.5rem' }}><strong>Reason:</strong> {r.reason || '—'}</p>
                    {r.proof_path && (
                      <p style={{ marginTop: '0.5rem' }}>
                        <strong>Proof:</strong>{' '}
                        <a href={r.proof_path} target="_blank" rel="noopener noreferrer">View proof</a>
                      </p>
                    )}
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Reported {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => deleteJob(r.job_id, r.job_title)} className="btn btn-danger">Delete Job</button>
                    <button onClick={() => dismissReport(r.id)} className="btn btn-secondary">Dismiss Report</button>
                    <Link to={`/jobs/${r.job_id}`} className="btn btn-secondary">View Job</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === 'companies' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {companies.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No organizations.</div>
            ) : (
              companies.map((c, i) => (
                <div key={i} className="card">
                  <p style={{ fontWeight: 600 }}>{c.company_name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{c.hr_count} HR{c.hr_count !== 1 ? 's' : ''}</p>
                </div>
              ))
            )}
          </div>
        ) : tab === 'hrs' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hrs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No HRs registered.</div>
            ) : (
              hrs.map((h) => (
                <div key={h.id} className="card">
                  <p style={{ fontWeight: 600 }}>{h.full_name || '—'}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{h.email}</p>
                  <p style={{ fontSize: '0.875rem' }}>{h.company_name || '—'}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Joined {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        ) : tab === 'students' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {students.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No students registered.</div>
            ) : (
              students.map((s) => (
                <div key={s.id} className="card">
                  <p style={{ fontWeight: 600 }}>{s.full_name || '—'}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{s.email}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Joined {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
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
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{job.company_name || job.hr_company} · {job.hr_email} · {job.application_count || 0} applications</p>
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

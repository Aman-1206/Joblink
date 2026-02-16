import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function HRDashboard() {
  const [tab, setTab] = useState('jobs');
  const [searchJobs, setSearchJobs] = useState('');
  const [searchApplicants, setSearchApplicants] = useState('');
  const [searchJobApplicants, setSearchJobApplicants] = useState('');
  const [jobs, setJobs] = useState([]);
  const [allApplicants, setAllApplicants] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', companyName: '', location: '', type: 'Full-time' });
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const qJobs = searchJobs.trim() ? `?q=${encodeURIComponent(searchJobs.trim())}` : '';
    const qApplicants = searchApplicants.trim() ? `?q=${encodeURIComponent(searchApplicants.trim())}` : '';
    Promise.all([
      api.get(`/hr/my-jobs${qJobs}`).then(r => r.data).catch(() => []),
      api.get(`/hr/all-applicants${qApplicants}`).then(r => r.data).catch(() => []),
    ]).then(([j, a]) => {
      setJobs(j);
      setAllApplicants(a);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab, showCreate, searchJobs, searchApplicants]);

  const loadApplications = () => {
    if (selectedJob) {
      const q = searchJobApplicants.trim() ? `?q=${encodeURIComponent(searchJobApplicants.trim())}` : '';
      api.get(`/hr/jobs/${selectedJob.id}/applications${q}`)
        .then(res => setApplications(res.data))
        .catch(() => setApplications([]));
    } else {
      setApplications([]);
    }
  };

  useEffect(loadApplications, [selectedJob, searchJobApplicants]);

  const totalApplicants = jobs.reduce((s, j) => s + (j.application_count || 0), 0);
  const decisionsMade = allApplicants.filter(a => a.status === 'accepted' || a.status === 'rejected').length;

  const updateApplicationStatus = async (appId, status, confirmReject = false) => {
    if (status === 'rejected' && confirmReject && !window.confirm('Are you sure you want to reject this applicant?')) return;
    try {
      await api.patch(`/hr/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/hr/jobs', { ...form, companyName: form.companyName || user?.company_name || 'Your Company' });
      setShowCreate(false);
      setForm({ title: '', description: '', companyName: '', location: '', type: 'Full-time' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const statusStyle = (s) => ({
    padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
    background: s === 'accepted' ? 'var(--success-light)' : s === 'rejected' ? 'var(--danger-light)' : 'var(--warning-light)',
    color: s === 'accepted' ? 'var(--success)' : s === 'rejected' ? 'var(--danger)' : 'var(--warning)',
  });

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>HR Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Manage your jobs and applicants</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">+ Post Job</button>
      </div>

      {/* Interactive summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => { setTab('jobs'); setSelectedJob(null); }}
          className="card stat-card-blue"
          style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{jobs.length}</p>
          <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Total Jobs</p>
        </button>
        <button
          onClick={() => { setTab('jobs'); setSelectedJob(null); }}
          className="card stat-card-green"
          style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{jobs.length}</p>
          <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Active Jobs</p>
        </button>
        <button
          onClick={() => setTab('applicants')}
          className="card stat-card-orange"
          style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totalApplicants}</p>
          <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Total Applicants</p>
        </button>
        <button
          onClick={() => setTab('applicants')}
          className="card stat-card-red"
          style={{ textAlign: 'center', padding: '1.25rem', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{decisionsMade}</p>
          <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Decisions Made</p>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {tab === 'jobs' && (
          <input
            type="search"
            placeholder="Search jobs by title, company, location..."
            value={searchJobs}
            onChange={(e) => setSearchJobs(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', maxWidth: 320 }}
          />
        )}
        {tab === 'applicants' && (
          <input
            type="search"
            placeholder="Search applicants by name, email, job title..."
            value={searchApplicants}
            onChange={(e) => setSearchApplicants(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', maxWidth: 320 }}
          />
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button
          className={`btn ${tab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: '-1px' }}
          onClick={() => { setTab('jobs'); setSelectedJob(null); }}
        >
          My Jobs
        </button>
        <button
          className={`btn ${tab === 'applicants' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: '-1px' }}
          onClick={() => setTab('applicants')}
        >
          All Applicants
        </button>
        {selectedJob && (
          <button className="btn btn-secondary" onClick={() => setSelectedJob(null)} style={{ marginLeft: 'auto' }}>
            ← Back
          </button>
        )}
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create Job Listing</h3>
          <form onSubmit={handleCreateJob}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Job Title *</label>
                <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Software Engineer" required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Remote / New York" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Job Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder={user?.company_name || 'Your Company'} />
              </div>
            </div>
            <div className="form-group">
              <label>Job Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Responsibilities, requirements..." style={{ minHeight: 120 }} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary">Post Job</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>Cancel</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
      ) : selectedJob ? (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Applications for {selectedJob.title}</h3>
          <input
            type="search"
            placeholder="Search applicants by name, email..."
            value={searchJobApplicants}
            onChange={(e) => setSearchJobApplicants(e.target.value)}
            style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', width: '100%', maxWidth: 320 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {applications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No applications yet.</div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600 }}>{app.full_name || 'Applicant'}</p>
                        <span style={statusStyle(app.status)}>{app.status}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{app.email}</p>
                      {app.cover_letter && <p style={{ marginTop: '0.5rem', fontSize: '0.9375rem' }}>{app.cover_letter.slice(0, 200)}{app.cover_letter.length > 200 ? '...' : ''}</p>}
                      <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {app.resume_path && <a href={app.resume_path} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View Resume</a>}
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => updateApplicationStatus(app.id, 'accepted')} className="btn btn-primary">Accept</button>
                          <button onClick={() => updateApplicationStatus(app.id, 'rejected', true)} className="btn btn-danger">Reject</button>
                        </>
                      )}
                      {(app.status === 'accepted' || app.status === 'rejected') && (
                        <>
                          <button onClick={() => updateApplicationStatus(app.id, 'pending')} className="btn btn-secondary">Revert to Pending</button>
                          {app.status === 'accepted' ? (
                            <button onClick={() => updateApplicationStatus(app.id, 'rejected', true)} className="btn btn-danger">Reject</button>
                          ) : (
                            <button onClick={() => updateApplicationStatus(app.id, 'accepted')} className="btn btn-primary">Accept</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : tab === 'applicants' ? (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>All Applicants</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {allApplicants.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No applicants yet.</div>
            ) : (
              allApplicants.map((app) => (
                <div key={app.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontWeight: 600 }}>{app.full_name || 'Applicant'}</p>
                      <span style={statusStyle(app.status)}>{app.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{app.email}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{app.job_title} · {app.company_name}</p>
                  </div>
                  <button onClick={() => setSelectedJob({ id: app.job_id, title: app.job_title })} className="btn btn-primary">View Details</button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              You haven't posted any jobs yet. Create your first job above!
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{job.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{job.company_name} · {job.location || 'Remote'} · {job.type}</p>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {job.application_count || 0} applicant{(job.application_count || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setSelectedJob(job)} className="btn btn-primary">View Applicants →</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

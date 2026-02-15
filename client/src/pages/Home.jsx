import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      <section style={{
        textAlign: 'center',
        padding: '4rem 0',
        maxWidth: '720px',
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.2, color: 'var(--text)' }}>
          Find Your Dream Job
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', marginBottom: '2rem' }}>
          JobLink connects talented students with top companies. Browse jobs, apply with one click,
          and track your applications — or if you're HR, post jobs and discover great candidates.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/jobs" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Browse Jobs</Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>Create Account</Link>
        </div>
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem',
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎓</div>
          <h3 style={{ marginBottom: '0.5rem' }}>For Students</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            Create an account, browse jobs, and apply with your resume. Track all your applications in one place.
          </p>
          <Link to="/register" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Sign Up as Student
          </Link>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💼</div>
          <h3 style={{ marginBottom: '0.5rem' }}>For HR / Recruiters</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            Use your official company email (e.g. hr@google.com) to register. Post jobs and view applicant resumes.
          </p>
          <Link to="/register" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Sign Up as HR
          </Link>
        </div>
      </section>
    </div>
  );
}

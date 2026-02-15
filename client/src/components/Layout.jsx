import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const initials = user?.profile_photo
    ? null
    : (user?.full_name?.[0] || user?.email?.[0] || '?').toUpperCase();

  const navLinks = (
    <>
      <Link to="/jobs" onClick={() => setShowNav(false)}>Jobs</Link>
      {user?.role === 'student' && <Link to="/saved-jobs" onClick={() => setShowNav(false)}>Saved Jobs</Link>}
      {user?.role === 'student' && <Link to="/my-applications" onClick={() => setShowNav(false)}>Application Status</Link>}
      {user?.role === 'hr' && <Link to="/hr/dashboard" onClick={() => setShowNav(false)}>HR Dashboard</Link>}
      {user?.role === 'admin' && <Link to="/admin/dashboard" onClick={() => setShowNav(false)}>Admin</Link>}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0.875rem 0',
        boxShadow: 'var(--shadow)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowNav(!showNav)}
              style={{ background: 'none', border: 'none', padding: '0.5rem', color: 'var(--text)', cursor: 'pointer' }}
              aria-label="Menu"
            >
              <MenuIcon />
            </button>
            <Link to="/" style={{ textDecoration: 'none', fontWeight: 700, fontSize: '1.35rem', color: 'var(--accent)' }}>
              JobLink
            </Link>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {navLinks}
            </div>
            {user ? (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link to="/profile" style={{ padding: '0.5rem', color: 'var(--text-muted)' }} title="Settings">
                  <SettingsIcon />
                </Link>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: user.profile_photo ? `url(${user.profile_photo}) center/cover` : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: user.profile_photo ? 'transparent' : 'white',
                    }}
                  >
                    {initials}
                  </div>
                  <span style={{ fontSize: '0.9375rem' }}>{user.full_name || user.email?.split('@')[0]}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>▼</span>
                </button>
                {showProfileMenu && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '180px',
                        zIndex: 20,
                        overflow: 'hidden',
                      }}
                    >
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          color: 'inherit',
                          textDecoration: 'none',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        Manage Profile
                      </Link>
                      <button
                        onClick={logout}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Sign In</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
              </>
            )}
          </nav>
        </div>
        {showNav && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '1rem 0',
              background: 'var(--bg-card)',
            }}
          >
            <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navLinks}
            </div>
          </div>
        )}
      </header>

      <main style={{ flex: 1, padding: '2rem 0' }}>
        {children}
      </main>

      <footer style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        padding: '1.5rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
      }}>
        © {new Date().getFullYear()} JobLink. Find your dream job.
      </footer>
    </div>
  );
}

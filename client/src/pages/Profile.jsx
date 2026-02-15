import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        setFullName(res.data.full_name || '');
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { fullName });
      setUser(data);
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await api.post('/auth/profile/photo', formData, true);
      setUser(data);
      setSuccess('Photo updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="container" style={{ maxWidth: '560px' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Manage Profile</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Update your name and profile photo</p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: user.profile_photo ? `url(${user.profile_photo}) center/cover` : 'var(--bg-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '2rem',
              overflow: 'hidden',
            }}
          >
            {!user.profile_photo && (user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn btn-secondary"
              disabled={photoUploading}
            >
              {photoUploading ? 'Uploading...' : 'Change Photo'}
            </button>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              JPG, PNG or WebP. Max 2MB.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Email cannot be changed
            </p>
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

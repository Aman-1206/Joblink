import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/jobs';
    } else {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
      <p>Signing you in...</p>
    </div>
  );
}

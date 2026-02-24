import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password);
      if (result.success) {
        const role = result.user?.role;
        if (role === 'admin') { navigate('/admin/dashboard'); }
        else if (role === 'organizer') { navigate('/organizer/dashboard'); }
        else {
          try {
            const profileRes = await fetch(`${API}/api/users/profile`, { headers: { 'Authorization': `Bearer ${result.user.token}` } });
            const profile = await profileRes.json();
            if (profileRes.ok && !profile.hasCompletedOnboarding) { navigate('/onboarding'); }
            else { navigate('/dashboard'); }
          } catch { navigate('/dashboard'); }
        }
      } else { setError(result.error); }
    } catch (err) { setError('Failed to connect to the server.'); }
  };

  return (
    <div style={{ padding: '40px 20px', minHeight: '80vh' }}>
      <h1>Login</h1>
      {error && <p style={{ padding: '10px', backgroundColor: 'var(--red)', border: '2px solid var(--black)', maxWidth: '350px', margin: '0 auto 15px auto' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '350px', margin: '0 auto', gap: '10px' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" style={{ padding: '12px', fontSize: '1.2rem' }}>Login</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
};

export default Login;

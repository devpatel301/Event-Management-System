import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkStyle = { textDecoration: 'none', color: 'var(--black)', fontWeight: 'bold' };

  return (
    <nav style={{ 
      padding: '12px 20px', 
      borderBottom: '3px solid var(--black)', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      backgroundColor: 'var(--yellow)'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ 
          fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', color: 'var(--black)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <img src="/logo.png" alt="Felicity Logo" style={{ height: '40px' }} />
          Felicity EMS
        </Link>

        {(!user || user.role === 'participant') && (
          <>
            <Link to="/events" style={linkStyle}>Browse Events</Link>
            <Link to="/clubs" style={linkStyle}>Clubs</Link>
            {user && <Link to="/dashboard" style={linkStyle}>Dashboard</Link>}
            {user && <Link to="/teams" style={linkStyle}>Teams</Link>}
          </>
        )}

        {user && user.role === 'organizer' && (
          <>
            <Link to="/organizer/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/organizer/events/create" style={linkStyle}>Create Event</Link>
            <Link to="/organizer/dashboard#ongoing" style={linkStyle}>Ongoing Events</Link>
          </>
        )}

        {user && user.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/admin/organizers" style={linkStyle}>Manage Clubs</Link>
            <Link to="/admin/password-reset" style={linkStyle}>Password Reset</Link>
          </>
        )}
      </div>
      <div>
        {user ? (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Welcome, {user.name || user.firstName}</span>
            {(user.role === 'participant' || user.role === 'organizer') && (
              <Link to="/profile" style={linkStyle}>Profile</Link>
            )}
            <button onClick={handleLogout} style={{ 
              padding: '5px 12px', backgroundColor: 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)'
            }}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={{ 
              textDecoration: 'none', backgroundColor: 'var(--yellow)', color: 'var(--black)',
              padding: '6px 14px', border: '2px solid var(--black)', fontWeight: 'bold'
            }}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

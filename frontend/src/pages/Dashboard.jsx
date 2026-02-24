import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');

  useEffect(() => {
    if (user) { fetchRegistrations(); fetchTeams(); fetchUnread(); }
  }, [user]);

  // Poll unread counts every 10 seconds
  useEffect(() => {
    if (!user || teams.length === 0) return;
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [user, teams]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${API}/api/registrations/my`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      const data = await response.json();
      if (response.ok) setRegistrations(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchTeams = async () => {
    try {
      const r = await fetch(`${API}/api/teams/my`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      const d = await r.json();
      if (r.ok) setTeams(d);
    } catch (e) { console.error(e); }
  };

  const fetchUnread = async () => {
    try {
      const r = await fetch(`${API}/api/chat/unread/counts`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      const d = await r.json();
      if (r.ok) setUnreadCounts(d);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Dashboard...</div>;

  const getFilteredRegistrations = () => {
    const now = new Date();
    return registrations.filter(reg => reg.event).filter(reg => {
      const isPast = new Date(reg.event.endDate) < now;
      switch(activeTab) {
        case 'Upcoming': return !isPast && reg.status !== 'Cancelled';
        case 'Normal': return reg.event.type === 'Normal' && reg.status !== 'Cancelled';
        case 'Merchandise': return reg.event.type === 'Merchandise';
        case 'Completed': return reg.event?.status === 'Completed' || (isPast && reg.status === 'Confirmed');
        case 'Cancelled': return reg.event?.status === 'Cancelled' || reg.status === 'Cancelled' || reg.status === 'Rejected';
        default: return true;
      }
    });
  };

  const filteredRegs = getFilteredRegistrations();

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <h1>My Dashboard</h1>

      {/* Teams Section */}
      {teams.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '10px' }}>My Teams</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {teams.map(team => {
              const unread = unreadCounts[team._id] || 0;
              return (
                <Link key={team._id} to={`/teams/${team._id}/chat`} style={{ textDecoration: 'none', color: '#000' }}>
                  <div style={{ border: '2px solid #000', padding: '12px', backgroundColor: '#b3f6ff', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1em' }}>{team.name}</h3>
                      {unread > 0 && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: '20px', height: '20px', borderRadius: '50%',
                          backgroundColor: '#ff3b3b', color: '#fff', fontSize: '0.75em',
                          fontWeight: 'bold', padding: '0 5px'
                        }}>{unread}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85em' }}>{team.event?.name || 'Unknown Event'}</p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.8em', color: '#555' }}>
                      {team.members.length} members · {team.status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', borderBottom: '3px solid #000', marginBottom: '20px' }}>
        {['Upcoming', 'Normal', 'Merchandise', 'Completed', 'Cancelled'].map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold',
            backgroundColor: activeTab === tab ? '#fdef26' : 'transparent',
            borderBottom: activeTab === tab ? '3px solid #000' : 'none',
          }}>{tab}</div>
        ))}
      </div>
      


      {filteredRegs.length === 0 ? (
        <p>No {activeTab.toLowerCase()} events found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredRegs.map(reg => (
            <div key={reg._id} style={{ border: '2px solid #000', padding: '15px', backgroundColor: '#ffd6a5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{reg.event.name}</h3>
                  <p style={{ margin: 0 }}>{new Date(reg.event.startDate).toLocaleString()} | {reg.event.type}</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>Organized by: {reg.event.organizer?.name || 'Unknown'}</p>
                  {reg.team && <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', fontWeight: 'bold', color: '#6a0dad' }}>Team: {reg.team.name}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block', padding: '4px 10px', fontWeight: 'bold', border: '2px solid #000',
                    backgroundColor: '#fff', marginBottom: '10px'
                  }}>{reg.status}</div>
                  <br />
                  {reg.status === 'Confirmed' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                      <Link to={`/ticket/${reg._id}`} style={{ fontWeight: 'bold' }}>View Ticket &rarr;</Link>
                      {new Date(reg.event.endDate) < new Date() && (
                        <Link to={`/feedback/${reg.event._id}`} style={{ fontSize: '0.85em' }}>Give Feedback</Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

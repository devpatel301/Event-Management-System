import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');

  useEffect(() => { if (user) fetchRegistrations(); }, [user]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${API}/api/registrations/my`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      const data = await response.json();
      if (response.ok) setRegistrations(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
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
        case 'Completed': return isPast && reg.status === 'Confirmed';
        case 'Cancelled': return reg.status === 'Cancelled' || reg.status === 'Rejected';
        default: return true;
      }
    });
  };

  const filteredRegs = getFilteredRegistrations();

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <h1>My Dashboard</h1>
      
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

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';

const ClubDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchClubDetails(); }, [id]);

  const fetchClubDetails = async () => {
    try { const r = await fetch(`${API}/api/organizers/${id}`); const d = await r.json(); if (r.ok) setData(d); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!data) return <div style={{ padding: '20px' }}>Organizer not found</div>;

  const { organizer, upcomingEvents, pastEvents } = data;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <Link to="/clubs" style={{ display: 'inline-block', marginBottom: '20px', padding: '6px 12px', backgroundColor: 'var(--gray-light)', border: '2px solid var(--black)', textDecoration: 'none' }}>Back to Clubs</Link>
      
      <div style={{ borderBottom: '3px solid var(--black)', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>{organizer.name}</h1>
        <p style={{ fontSize: '1.2em', fontWeight: 'bold', backgroundColor: 'var(--purple)', display: 'inline-block', padding: '4px 12px', border: '2px solid var(--black)' }}>{organizer.category}</p>
        <p>{organizer.desc}</p>
        <p><strong>Contact:</strong> <a href={`mailto:${organizer.email}`}>{organizer.email}</a></p>
      </div>

      <h2>Upcoming Events</h2>
      {upcomingEvents.length === 0 ? <p>No upcoming events.</p> : (
        <div style={{ display: 'grid', gap: '15px', marginBottom: '40px' }}>
          {upcomingEvents.map(event => (
            <div key={event._id} style={{ border: '2px solid var(--black)', padding: '15px', backgroundColor: 'var(--white)' }}>
              <h3><Link to={`/events/${event._id}`}>{event.name}</Link></h3>
              <p>{new Date(event.startDate).toLocaleDateString()} | {event.type}</p>
            </div>
          ))}
        </div>
      )}

      <h2>Past Events</h2>
      {pastEvents.length === 0 ? <p>No past events.</p> : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {pastEvents.map(event => (
            <div key={event._id} style={{ border: '2px solid var(--black)', padding: '15px', backgroundColor: 'var(--gray-light)', opacity: 0.7 }}>
              <h3>{event.name}</h3>
              <p>{new Date(event.startDate).toLocaleDateString()} | {event.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubDetail;

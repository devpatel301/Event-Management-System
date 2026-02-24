import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const OrgDashboard = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [analytics, setAnalytics] = useState({ completedEventCount: 0, totalRegistrations: 0, totalAttended: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchEvents(); fetchAnalytics(); }, []);

    const fetchEvents = async () => {
        try {
            const r = await fetch(`${API}/api/events/organizer/my`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            const d = await r.json();
            if (r.ok) setEvents(d);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchAnalytics = async () => {
        try {
            const r = await fetch(`${API}/api/events/organizer/analytics`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            const d = await r.json();
            if (r.ok) setAnalytics(d);
        } catch (e) { console.error(e); }
    };

    const deleteEvent = async (eventId) => {
        if (!window.confirm('Delete this draft event? This cannot be undone.')) return;
        try {
            const r = await fetch(`${API}/api/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const d = await r.json();
            if (r.ok) {
                setEvents(events.filter(e => e._id !== eventId));
            } else {
                alert(d.message || 'Failed to delete event');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    const statItems = [
        { label: 'Completed Events', value: analytics.completedEventCount },
        { label: 'Registrations', value: analytics.totalRegistrations },
        { label: 'Attendance', value: analytics.totalAttended },
        { label: 'Revenue', value: `Rs. ${analytics.totalRevenue}` },
    ];

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Organizer Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/organizer/feedback" style={{ padding: '10px 20px', backgroundColor: 'var(--gray-light)', color: 'var(--black)', textDecoration: 'none', border: '2px solid var(--black)', fontWeight: 'bold' }}>
                        View Feedback
                    </Link>
                    <Link to="/organizer/events/create" style={{ padding: '10px 20px', backgroundColor: 'var(--yellow)', color: 'var(--black)', textDecoration: 'none', border: '2px solid var(--black)', fontWeight: 'bold' }}>
                        + Create New Event
                    </Link>
                </div>
            </div>

            {/* Completed Events Stats */}
            <h3 style={{ marginBottom: '10px' }}>Completed Events Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '40px' }}>
                {statItems.map(s => (
                    <div key={s.label} style={{ padding: '15px', border: '2px solid var(--black)', textAlign: 'center', backgroundColor: 'var(--gray-light)' }}>
                        <div style={{ fontSize: '0.85em', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.6em', fontWeight: 'bold' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Events by status */}
            {['Ongoing', 'Published', 'Draft', 'Cancelled', 'Closed', 'Completed'].map(status => {
                const statusEvents = events.filter(e => e.status === status);
                if (statusEvents.length === 0) return null;
                return (
                    <div key={status} style={{ marginBottom: '30px' }}>
                        <h3>{status} Events ({statusEvents.length})</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                            {statusEvents.map(event => (
                                <div key={event._id} style={{ border: '2px solid var(--black)', padding: '15px', backgroundColor: 'var(--cyan)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: '0 0 8px 0', flex: 1 }}>{event.name}</h3>
                                        <span style={{ padding: '2px 8px', fontSize: '0.8em', fontWeight: 'bold', border: '2px solid var(--black)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                                            {event.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>{new Date(event.startDate).toLocaleDateString()}</p>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.9em' }}>Type: {event.type} | Registrations: {event.registeredCount || 0}</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <Link to={`/organizer/events/${event._id}`} style={{ padding: '5px 10px', backgroundColor: 'var(--yellow)', color: 'var(--black)', textDecoration: 'none', border: '2px solid var(--black)', fontWeight: 'bold', fontSize: '0.9em' }}>
                                            Manage
                                        </Link>
                                        <Link to={`/organizer/events/${event._id}/edit`} style={{ padding: '5px 10px', backgroundColor: 'var(--yellow)', color: 'var(--black)', textDecoration: 'none', border: '2px solid var(--black)', fontWeight: 'bold', fontSize: '0.9em' }}>
                                            Edit
                                        </Link>
                                        {event.status === 'Draft' && (
                                            <button onClick={() => deleteEvent(event._id)} style={{ padding: '5px 10px', backgroundColor: 'var(--white)', color: 'var(--black)', border: '2px solid var(--black)', fontWeight: 'bold', fontSize: '0.9em', cursor: 'pointer' }}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {events.length === 0 && <p>No events created yet.</p>}
        </div>
    );
};

export default OrgDashboard;

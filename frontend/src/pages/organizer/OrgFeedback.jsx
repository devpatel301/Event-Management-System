import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const OrgFeedback = () => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState([]);
    const [events, setEvents] = useState([]);
    const [filterRating, setFilterRating] = useState('');
    const [filterEvent, setFilterEvent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchFeedback(); }, [filterRating, filterEvent]);

    const fetchFeedback = async () => {
        try {
            const params = new URLSearchParams();
            if (filterRating) params.set('rating', filterRating);
            if (filterEvent) params.set('eventId', filterEvent);
            const r = await fetch(`${API}/api/feedback/organizer/all?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const d = await r.json();
            if (r.ok) {
                setFeedbacks(d.feedbacks);
                setEvents(d.events);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const renderStars = (rating) => {
        return rating + '/5';
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading feedback...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <Link to="/organizer/dashboard" style={{ marginBottom: '20px', display: 'inline-block', padding: '6px 12px', border: '2px solid var(--black)', textDecoration: 'none', backgroundColor: 'var(--gray-light)' }}>Back to Dashboard</Link>

            <h1 style={{ marginTop: '15px' }}>Feedback & Ratings</h1>
            <p style={{ color: 'var(--gray)', marginBottom: '15px' }}>Anonymous feedback from participants across your events.</p>

            {feedbacks.length > 0 && (
                <p style={{ marginBottom: '20px' }}>
                    Average rating: <strong>{(feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)} / 5</strong>
                </p>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} style={{ padding: '8px', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' }}>
                    <option value="">All Events</option>
                    {events.map(ev => (
                        <option key={ev._id} value={ev._id}>{ev.name}</option>
                    ))}
                </select>
                <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ padding: '8px', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' }}>
                    <option value="">All Ratings</option>
                    {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                    ))}
                </select>
            </div>

            {/* Feedback List */}
            {feedbacks.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' }}>
                    <p style={{ fontSize: '1.1em', color: 'var(--gray)' }}>No feedback yet.</p>
                    <p style={{ fontSize: '0.9em', color: 'var(--gray)' }}>Feedback will appear here after participants submit reviews for your events.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {feedbacks.map(f => (
                        <div key={f._id} style={{ padding: '15px', border: '2px solid var(--black)', backgroundColor: 'var(--white)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div>
                                    <span style={{ fontSize: '1.2em', color: 'var(--black)', letterSpacing: '2px' }}>{renderStars(f.rating)}</span>
                                    <span style={{ marginLeft: '8px', fontWeight: 'bold', fontSize: '0.95em' }}>{f.rating}/5</span>
                                </div>
                                <span style={{ fontSize: '0.8em', color: 'var(--gray)' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize: '0.8em', color: 'var(--gray)', marginBottom: '6px', fontWeight: 'bold' }}>{f.eventName}</div>
                            {f.comment ? (
                                <p style={{ margin: 0, color: 'var(--black)', lineHeight: '1.5' }}>{f.comment}</p>
                            ) : (
                                <p style={{ margin: 0, color: 'var(--gray)', fontStyle: 'italic' }}>No comment provided</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrgFeedback;

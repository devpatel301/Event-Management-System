import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const OrgFeedback = () => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState({ total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
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
                setStats(d.stats);
                setEvents(d.events);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const exportCSV = () => {
        const headers = 'Event,Rating,Comment,Date\n';
        const rows = feedbacks.map(f => {
            const comment = `"${(f.comment || '').replace(/"/g, '""')}"`;
            return [
                `"${f.eventName}"`,
                f.rating,
                comment,
                new Date(f.createdAt).toLocaleDateString()
            ].join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'feedback_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderStars = (rating) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const maxDist = Math.max(...Object.values(stats.distribution), 1);

    if (loading) return <div style={{ padding: '20px' }}>Loading feedback...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <Link to="/organizer/dashboard" style={{ marginBottom: '20px', display: 'inline-block', padding: '6px 12px', border: '2px solid #000', textDecoration: 'none', backgroundColor: '#fff' }}>&lArr; Back to Dashboard</Link>

            <h1 style={{ marginTop: '15px' }}>Feedback & Ratings</h1>
            <p style={{ color: '#555', marginBottom: '25px' }}>Anonymous feedback from participants across your completed events.</p>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center', backgroundColor: '#f3e8ff' }}>
                    <div style={{ fontSize: '0.85em', marginBottom: '4px' }}>Total Feedback</div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.total}</div>
                </div>
                <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center', backgroundColor: '#fdef26' }}>
                    <div style={{ fontSize: '0.85em', marginBottom: '4px' }}>Average Rating</div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.average} / 5</div>
                </div>
                <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center', backgroundColor: '#c1ffca' }}>
                    <div style={{ fontSize: '0.85em', marginBottom: '4px' }}>5-Star Reviews</div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.distribution[5]}</div>
                </div>
                <div style={{ padding: '20px', border: '2px solid #000', textAlign: 'center', backgroundColor: '#ffd6a5' }}>
                    <div style={{ fontSize: '0.85em', marginBottom: '4px' }}>Events with Feedback</div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{events.length}</div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #000', backgroundColor: '#fff' }}>
                <h3 style={{ marginTop: 0 }}>Rating Distribution</h3>
                {[5, 4, 3, 2, 1].map(star => {
                    const count = stats.distribution[star] || 0;
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ width: '30px', fontWeight: 'bold', fontSize: '0.95em' }}>{star} ★</span>
                            <div style={{ flex: 1, height: '20px', backgroundColor: '#eee', border: '1px solid #ccc', position: 'relative' }}>
                                <div style={{
                                    width: `${(count / maxDist) * 100}%`,
                                    height: '100%',
                                    backgroundColor: star >= 4 ? '#4caf50' : star === 3 ? '#ff9800' : '#f44336',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                            <span style={{ width: '60px', fontSize: '0.85em', color: '#555' }}>{count} ({pct}%)</span>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} style={{ padding: '8px', border: '2px solid #000', backgroundColor: '#efefe2' }}>
                    <option value="">All Events</option>
                    {events.map(ev => (
                        <option key={ev._id} value={ev._id}>{ev.name}</option>
                    ))}
                </select>
                <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ padding: '8px', border: '2px solid #000', backgroundColor: '#efefe2' }}>
                    <option value="">All Ratings</option>
                    {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                    ))}
                </select>
                <button onClick={exportCSV} disabled={feedbacks.length === 0} style={{ padding: '8px 16px', backgroundColor: '#ff6a3d', color: '#000', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>
                    Export CSV
                </button>
            </div>

            {/* Feedback List */}
            {feedbacks.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', border: '2px solid #000', backgroundColor: '#f9f9f9' }}>
                    <p style={{ fontSize: '1.1em', color: '#666' }}>No feedback yet.</p>
                    <p style={{ fontSize: '0.9em', color: '#999' }}>Feedback will appear here after participants submit reviews for your completed events.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {feedbacks.map(f => (
                        <div key={f._id} style={{ padding: '15px', border: '2px solid #000', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div>
                                    <span style={{ fontSize: '1.2em', color: '#f5a623', letterSpacing: '2px' }}>{renderStars(f.rating)}</span>
                                    <span style={{ marginLeft: '8px', fontWeight: 'bold', fontSize: '0.95em' }}>{f.rating}/5</span>
                                </div>
                                <span style={{ fontSize: '0.8em', color: '#888' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '6px', fontWeight: 'bold' }}>{f.eventName}</div>
                            {f.comment ? (
                                <p style={{ margin: 0, color: '#333', lineHeight: '1.5' }}>{f.comment}</p>
                            ) : (
                                <p style={{ margin: 0, color: '#aaa', fontStyle: 'italic' }}>No comment provided</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrgFeedback;

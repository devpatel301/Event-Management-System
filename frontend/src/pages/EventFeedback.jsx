import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const EventFeedback = () => {
    const { eventId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState([]);
    const [stats, setStats] = useState(null);
    const [filterRating, setFilterRating] = useState('');

    useEffect(() => {
        const fetchEvent = async () => { try { const r = await fetch(`${API}/api/events/${eventId}`); const d = await r.json(); if (r.ok) setEvent(d); } catch { console.error('Fetch error'); } };
        fetchEvent();
        if (user && user.role === 'participant') checkFeedbackStatus();
        else if (user && (user.role === 'organizer' || user.role === 'admin')) fetchFeedbackData();
    }, [eventId, user]);

    const checkFeedbackStatus = async () => {
        try { const r = await fetch(`${API}/api/feedback/check/${eventId}`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setHasSubmitted(d.hasSubmitted); } catch { console.error('Check error'); } finally { setLoading(false); }
    };

    const fetchFeedbackData = async () => {
        try {
            const url = `${API}/api/feedback/event/${eventId}` + (filterRating ? `?rating=${filterRating}` : '');
            const fbRes = await fetch(url, { headers: { 'Authorization': `Bearer ${user.token}` } });
            const fbData = await fbRes.json(); if (fbRes.ok) setFeedbacks(fbData);
            const stRes = await fetch(`${API}/api/feedback/event/${eventId}/stats`, { headers: { 'Authorization': `Bearer ${user.token}` } });
            const stData = await stRes.json(); if (stRes.ok) setStats(stData);
        } catch { console.error('Fetch error'); } finally { setLoading(false); }
    };

    useEffect(() => { if (user && (user.role === 'organizer' || user.role === 'admin')) fetchFeedbackData(); }, [filterRating]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setMessage({ text: 'Please select a rating', type: 'error' }); return; }
        try {
            const r = await fetch(`${API}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ eventId, rating, comment }) });
            const d = await r.json();
            if (r.ok) { setMessage({ text: 'Thank you for your feedback!', type: 'success' }); setHasSubmitted(true); }
            else setMessage({ text: d.message, type: 'error' });
        } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    const handleExport = () => { window.open(`${API}/api/feedback/event/${eventId}/export?token=${user.token}`, '_blank'); };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
        <span onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
            style={{ cursor: 'pointer', fontSize: '2em', color: filled ? '#fdef26' : '#000', marginRight: '5px', textShadow: filled ? '0 0 2px #000' : 'none' }}>★</span>
    );

    // Participant View
    if (user && user.role === 'participant') {
        return (
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                <button onClick={() => navigate(-1)} style={{ marginBottom: '15px' }}>&larr; Back</button>
                <h1>Event Feedback</h1>
                {event && <p style={{ fontWeight: 'bold' }}>{event.name}</p>}

                {message.text && (
                    <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: message.type === 'success' ? '#c1ffca' : '#ff7676', border: '2px solid #000', fontWeight: 'bold' }}>{message.text}</div>
                )}

                {hasSubmitted ? (
                    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#c1ffca', border: '2px solid #000' }}>
                        <h3>You have already submitted feedback for this event.</h3>
                        <p>Thank you for your input!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ border: '2px solid #000', padding: '25px', backgroundColor: '#ffd6a5' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Rate this event:</label>
                            <div>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} filled={star <= (hoverRating || rating)} onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} />
                                ))}
                                {rating > 0 && <span style={{ marginLeft: '10px' }}>{rating}/5</span>}
                            </div>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label>Comments (optional):</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." style={{ minHeight: '100px' }} />
                        </div>
                        <p style={{ fontSize: '0.85em', marginBottom: '15px', backgroundColor: '#d0b4f4', padding: '8px', border: '1px solid #000' }}>
                            Your feedback is anonymous. The organizer will not see your identity.
                        </p>
                        <button type="submit" style={{ padding: '10px 25px', fontSize: '1em' }}>Submit Feedback</button>
                    </form>
                )}
            </div>
        );
    }

    // Organizer/Admin View
    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: '15px' }}>&larr; Back</button>
            <h1>Event Feedback</h1>
            {event && <p style={{ fontWeight: 'bold' }}>{event.name}</p>}

            {stats && (
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '20px', backgroundColor: '#b3f6ff', textAlign: 'center', border: '2px solid #000' }}>
                            <h4 style={{ margin: '0 0 5px' }}>Total Feedback</h4>
                            <p style={{ fontSize: '2em', margin: 0, fontWeight: 'bold' }}>{stats.total}</p>
                        </div>
                        <div style={{ padding: '20px', backgroundColor: '#fdef26', textAlign: 'center', border: '2px solid #000' }}>
                            <h4 style={{ margin: '0 0 5px' }}>Average Rating</h4>
                            <p style={{ fontSize: '2em', margin: 0, fontWeight: 'bold' }}>{stats.average} <span style={{ fontSize: '0.5em' }}>/ 5</span></p>
                        </div>
                        <div style={{ padding: '20px', backgroundColor: '#c1ffca', textAlign: 'center', border: '2px solid #000' }}>
                            <h4 style={{ margin: '0 0 5px' }}>Stars</h4>
                            <p style={{ fontSize: '2em', margin: 0 }}>{'★'.repeat(Math.round(stats.average))}{'☆'.repeat(5 - Math.round(stats.average))}</p>
                        </div>
                    </div>

                    <div style={{ padding: '15px', border: '2px solid #000', backgroundColor: '#f3e8ff' }}>
                        <h4 style={{ marginTop: 0 }}>Rating Distribution</h4>
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = stats.distribution[star] || 0;
                            const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
                            return (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <span style={{ width: '20px', textAlign: 'right' }}>{star}★</span>
                                    <div style={{ flex: 1, backgroundColor: '#000', height: '20px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#fdef26' }}></div>
                                    </div>
                                    <span style={{ width: '40px', fontSize: '0.85em' }}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label>Filter by rating:</label>
                    <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ width: 'auto' }}>
                        <option value="">All</option>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                    </select>
                </div>
                <button onClick={handleExport} style={{ backgroundColor: '#fdef26' }}>Export CSV</button>
            </div>

            {feedbacks.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '30px' }}>No feedback received yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {feedbacks.map(fb => (
                        <div key={fb._id} style={{ padding: '15px', border: '2px solid #000', backgroundColor: '#b3f6ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.2em' }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                                <span style={{ fontSize: '0.8em' }}>{new Date(fb.createdAt).toLocaleDateString()}</span>
                            </div>
                            {fb.comment && <p style={{ margin: 0 }}>{fb.comment}</p>}
                            {!fb.comment && <p style={{ margin: 0, fontStyle: 'italic' }}>No comment</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventFeedback;

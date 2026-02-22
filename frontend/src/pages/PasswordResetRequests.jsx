import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../api';

const PasswordResetRequests = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [generatedPasswords, setGeneratedPasswords] = useState({});

    useEffect(() => { fetchRequests(); }, [user.token]);

    const fetchRequests = async () => {
        try { const r = await fetch(`${API}/api/password-resets`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setRequests(d); } catch { console.error('Fetch error'); } finally { setLoading(false); }
    };

    const handleApprove = async (requestId) => {
        const comment = prompt('Add a comment (optional):') || '';
        try {
            const r = await fetch(`${API}/api/password-resets/${requestId}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ comment }) });
            const d = await r.json();
            if (r.ok) { setMessage({ text: 'Approved! New password generated.', type: 'success' }); setGeneratedPasswords(prev => ({ ...prev, [requestId]: d.generatedPassword })); fetchRequests(); }
            else setMessage({ text: d.message, type: 'error' });
        } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    const handleReject = async (requestId) => {
        const comment = prompt('Reason for rejection:');
        if (comment === null) return;
        try {
            const r = await fetch(`${API}/api/password-resets/${requestId}/reject`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ comment }) });
            const d = await r.json();
            if (r.ok) { setMessage({ text: 'Request rejected', type: 'success' }); fetchRequests(); }
            else setMessage({ text: d.message, type: 'error' });
        } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    const pending = requests.filter(r => r.status === 'Pending');
    const resolved = requests.filter(r => r.status !== 'Pending');

    const statusStyle = (status) => ({
        display: 'inline-block', padding: '3px 10px', fontSize: '0.85em', fontWeight: 'bold', border: '1px solid #000',
        backgroundColor: status === 'Approved' ? '#c1ffca' : status === 'Rejected' ? '#ff7676' : '#fdef26'
    });

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <h1>Password Reset Requests</h1>

            {message.text && (
                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: message.type === 'success' ? '#c1ffca' : '#ff7676', border: '2px solid #000', fontWeight: 'bold' }}>{message.text}</div>
            )}

            <h2>Pending Requests ({pending.length})</h2>
            {pending.length === 0 ? <p>No pending requests.</p> : (
                <div style={{ display: 'grid', gap: '12px', marginBottom: '30px' }}>
                    {pending.map(req => (
                        <div key={req._id} style={{ padding: '15px', border: '2px solid #000', backgroundColor: '#fdef26' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0' }}>{req.organizer?.name || 'Unknown'}</h3>
                                    <p style={{ margin: '0 0 5px 0' }}>{req.organizer?.email}</p>
                                    <p style={{ margin: '0 0 5px 0' }}><strong>Reason:</strong> {req.reason}</p>
                                    <p style={{ margin: 0, fontSize: '0.85em' }}>Requested: {new Date(req.createdAt).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleApprove(req._id)} style={{ backgroundColor: '#c1ffca' }}>Approve</button>
                                    <button onClick={() => handleReject(req._id)} style={{ backgroundColor: '#ff7676' }}>Reject</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {Object.keys(generatedPasswords).length > 0 && (
                <div style={{ padding: '15px', backgroundColor: '#b3f6ff', border: '2px solid #000', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Generated Passwords (share with organizer)</h3>
                    {Object.entries(generatedPasswords).map(([reqId, pwd]) => {
                        const req = requests.find(r => r._id === reqId);
                        return (
                            <p key={reqId} style={{ margin: '5px 0' }}>
                                <strong>{req?.organizer?.name || 'Organizer'}:</strong>{' '}
                                <span style={{ fontFamily: 'monospace', backgroundColor: '#fdef26', padding: '3px 8px', border: '1px solid #000' }}>{pwd}</span>
                                <button onClick={() => navigator.clipboard.writeText(pwd)} style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.8em' }}>Copy</button>
                            </p>
                        );
                    })}
                </div>
            )}

            <h2>Request History ({resolved.length})</h2>
            {resolved.length === 0 ? <p>No resolved requests yet.</p> : (
                <table>
                    <thead>
                        <tr><th>Club</th><th>Reason</th><th>Status</th><th>Comment</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                        {resolved.map(req => (
                            <tr key={req._id}>
                                <td>{req.organizer?.name || 'Unknown'}<br /><span style={{ fontSize: '0.8em' }}>{req.organizer?.email}</span></td>
                                <td>{req.reason}</td>
                                <td><span style={statusStyle(req.status)}>{req.status}</span></td>
                                <td>{req.adminComment || '-'}</td>
                                <td style={{ fontSize: '0.85em' }}>{req.resolvedDate ? new Date(req.resolvedDate).toLocaleString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default PasswordResetRequests;

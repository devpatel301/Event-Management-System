import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const TeamDashboard = () => {
    const { user } = useContext(AuthContext);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joinCode, setJoinCode] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => { fetchTeams(); }, [user.token]);

    const fetchTeams = async () => {
        try { const r = await fetch(`${API}/api/teams/my`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setTeams(d); } catch { console.error('Fetch error'); } finally { setLoading(false); }
    };

    const handleJoin = async (e) => {
        e.preventDefault(); setMessage({ text: '', type: '' }); if (!joinCode.trim()) return;
        try {
            const r = await fetch(`${API}/api/teams/join`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ teamCode: joinCode.trim() }) });
            const d = await r.json();
            if (r.ok) { setMessage({ text: 'Joined team!', type: 'success' }); setJoinCode(''); fetchTeams(); } else setMessage({ text: d.message, type: 'error' });
        } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    const handleLeave = async (teamId) => {
        if (!window.confirm('Leave this team?')) return;
        try { const r = await fetch(`${API}/api/teams/${teamId}/leave`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) { setMessage({ text: 'Left team', type: 'success' }); fetchTeams(); } else setMessage({ text: d.message, type: 'error' }); } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    const handleDelete = async (teamId) => {
        if (!window.confirm('Delete this team?')) return;
        try { const r = await fetch(`${API}/api/teams/${teamId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) { setMessage({ text: 'Team deleted', type: 'success' }); fetchTeams(); } else setMessage({ text: d.message, type: 'error' }); } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    const statusBg = { forming: 'var(--yellow)', complete: 'var(--cyan)', registered: 'var(--green)' };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <h1>My Teams</h1>

            <div style={{ padding: '20px', border: '2px solid var(--black)', marginBottom: '20px', backgroundColor: 'var(--gray-light)' }}>
                <h3 style={{ marginTop: 0 }}>Join a Team</h3>
                <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Enter team code (e.g. TEAM-A1B2C3)" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit">Join</button>
                </form>
            </div>

            {message.text && (
                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: message.type === 'success' ? 'var(--green)' : 'var(--red)', border: '2px solid var(--black)', fontWeight: 'bold' }}>{message.text}</div>
            )}

            {teams.length === 0 ? (
                <p>You are not part of any team yet. Create one from a Hackathon event page or join with a code above.</p>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {teams.map(team => {
                        const leaderId = team.leader && team.leader._id ? team.leader._id : team.leader;
                        const eventName = team.event && team.event.name ? team.event.name : 'Unknown';
                        return (
                        <div key={team._id} style={{ border: '2px solid var(--black)', padding: '20px', backgroundColor: 'var(--cyan)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0' }}>{team.name}</h3>
                                    <p style={{ margin: '0 0 5px 0' }}>Event: {eventName}</p>
                                    <p style={{ margin: '0 0 5px 0' }}>
                                        <strong>Status:</strong>{' '}
                                        <span style={{ fontWeight: 'bold', backgroundColor: statusBg[team.status] || 'var(--gray-light)', padding: '1px 8px', border: '1px solid var(--black)' }}>{team.status.toUpperCase()}</span>
                                    </p>
                                    <p style={{ margin: '0 0 5px 0' }}>
                                        <strong>Team Code:</strong>{' '}
                                        <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--yellow)', padding: '2px 6px', border: '1px solid var(--black)' }}>{team.teamCode}</span>
                                        <button onClick={() => navigator.clipboard.writeText(team.teamCode)} style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.8em' }}>Copy</button>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '0.9em' }}>{team.members.length} / {team.maxSize} members</p>
                                    {team.status === 'registered' && <Link to="/dashboard">View Tickets</Link>}
                                    {team.status !== 'registered' && <Link to={`/teams/${team._id}/chat`} style={{ display: 'block', marginTop: '5px' }}>Team Chat</Link>}
                                </div>
                            </div>

                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--purple)', border: '1px solid var(--black)' }}>
                                <strong>Members:</strong>
                                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                                    {team.members.map(member => (
                                        <li key={member._id} style={{ marginBottom: '3px' }}>
                                            {member.firstName} {member.lastName}
                                            {member._id === leaderId && <span style={{ backgroundColor: 'var(--yellow)', marginLeft: '8px', fontSize: '0.85em', padding: '1px 6px', border: '1px solid var(--black)' }}>(Leader)</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {team.status !== 'registered' && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                    {leaderId === user.userId ? (
                                        <button onClick={() => handleDelete(team._id)} style={{ backgroundColor: 'var(--red)', fontSize: '0.85em' }}>Delete Team</button>
                                    ) : (
                                        <button onClick={() => handleLeave(team._id)} style={{ backgroundColor: 'var(--gray-light)', fontSize: '0.85em' }}>Leave Team</button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                    })}
                </div>
            )}
        </div>
    );
};

export default TeamDashboard;

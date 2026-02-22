import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const TeamChat = () => {
    const { teamId } = useParams();
    const { user } = useContext(AuthContext);
    const [team, setTeam] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    const statusPollRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        const fetchTeam = async () => { try { const r = await fetch(`${API}/api/teams/${teamId}`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setTeam(d); } catch { console.error('Error'); } finally { setLoading(false); } };
        fetchTeam();
    }, [teamId, user.token]);

    useEffect(() => {
        const fetchMessages = async () => { try { const r = await fetch(`${API}/api/chat/${teamId}/messages`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setMessages(d); } catch { console.error('Error'); } };
        fetchMessages();
        pollRef.current = setInterval(async () => {
            try {
                const lastMsg = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
                const url = lastMsg ? `${API}/api/chat/${teamId}/messages?since=${lastMsg}` : `${API}/api/chat/${teamId}/messages`;
                const r = await fetch(url, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json();
                if (r.ok && d.length > 0) { setMessages(prev => { const all = prev.slice(); for (const msg of d) { let exists = false; for (const o of prev) { if (o._id === msg._id) { exists = true; break; } } if (!exists) all.push(msg); } return all; }); }
            } catch {}
        }, 2000);
        return () => clearInterval(pollRef.current);
    }, [teamId, user.token]);

    useEffect(() => {
        const fetchStatus = async () => { try { const r = await fetch(`${API}/api/chat/${teamId}/status`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) { setOnlineUsers(d.online || []); setTypingUsers(d.typing || []); } } catch {} };
        fetchStatus();
        statusPollRef.current = setInterval(fetchStatus, 3000);
        return () => clearInterval(statusPollRef.current);
    }, [teamId, user.token]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault(); if (!newMessage.trim()) return;
        try { const r = await fetch(`${API}/api/chat/${teamId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ message: newMessage.trim() }) }); const d = await r.json(); if (r.ok) { setMessages(prev => [...prev, d]); setNewMessage(''); } } catch { console.error('Send error'); }
    };

    const handleTyping = () => {
        fetch(`${API}/api/chat/${teamId}/typing`, { method: 'POST', headers: { 'Authorization': `Bearer ${user.token}` } }).catch(() => {});
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {}, 3000);
    };

    const getMemberName = (userId) => { if (!team) return 'Someone'; for (const m of team.members) { if (m._id === userId) return m.firstName; } return 'Someone'; };

    useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (!team) return <div style={{ padding: '20px' }}>Team not found</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            {/* Header */}
            <div style={{ borderBottom: '3px solid #000', paddingBottom: '10px', marginBottom: '10px' }}>
                <Link to="/teams" style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f3e8ff', border: '2px solid #000', textDecoration: 'none', marginBottom: '5px' }}>&larr; Back to Teams</Link>
                <h2 style={{ margin: '5px 0' }}>{team.name} - Chat</h2>
                <div style={{ fontSize: '0.85em' }}>
                    <span style={{ marginRight: '15px' }}>Event: {team.event?.name}</span>
                    <span>Online: {onlineUsers.length} / {team.members.length}
                        {onlineUsers.length > 0 && <span style={{ color: '#c1ffca', marginLeft: '5px' }}>●</span>}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                    {team.members.map(m => (
                        <span key={m._id} style={{
                            fontSize: '0.8em', padding: '2px 8px', fontWeight: 'bold',
                            backgroundColor: onlineUsers.includes(m._id) ? '#c1ffca' : '#ffd6a5',
                            border: '1px solid #000'
                        }}>{m.firstName}</span>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', backgroundColor: '#f3e8ff', border: '2px solid #000' }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center' }}>No messages yet. Start the conversation!</p>
                ) : (
                    messages.map(msg => {
                        const senderId = msg.sender && msg.sender._id ? msg.sender._id : msg.sender;
                        const isMe = senderId === user.userId;
                        return (
                            <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                                <div style={{
                                    maxWidth: '70%', padding: '8px 12px',
                                    backgroundColor: isMe ? '#d0b4f4' : '#fff9e0',
                                    border: '2px solid #000'
                                }}>
                                    {!isMe && <div style={{ fontSize: '0.75em', marginBottom: '3px', fontWeight: 'bold' }}>{msg.sender?.firstName || 'Unknown'}</div>}
                                    <div>{msg.message}</div>
                                    <div style={{ fontSize: '0.7em', textAlign: 'right', marginTop: '3px' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {typingUsers.length > 0 && (
                <div style={{ fontSize: '0.8em', padding: '4px 0' }}>
                    {typingUsers.map(uid => getMemberName(uid)).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
            )}

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} placeholder="Type a message..." style={{ flex: 1, fontSize: '1em' }} />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default TeamChat;

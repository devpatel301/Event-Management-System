import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const TeamChat = () => {
    const { teamId } = useParams();
    const { user } = useContext(AuthContext);
    const [team, setTeam] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);
    const statusPollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

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
        // Auto-detect links
        const urlRegex = /^(https?:\/\/[^\s]+)$/i;
        const isLink = urlRegex.test(newMessage.trim());
        const payload = { message: newMessage.trim() };
        if (isLink) payload.type = 'link';
        try { const r = await fetch(`${API}/api/chat/${teamId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify(payload) }); const d = await r.json(); if (r.ok) { setMessages(prev => [...prev, d]); setNewMessage(''); } } catch { console.error('Send error'); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch(`${API}/api/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${user.token}` }, body: formData });
            const uploadData = await uploadRes.json();
            if (uploadRes.ok) {
                const r = await fetch(`${API}/api/chat/${teamId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                    body: JSON.stringify({ message: file.name, type: 'file', fileUrl: uploadData.filePath, fileName: file.name })
                });
                const d = await r.json();
                if (r.ok) setMessages(prev => [...prev, d]);
            } else { alert(uploadData.message || 'Upload failed'); }
        } catch { console.error('Upload error'); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
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
            <div style={{ borderBottom: '3px solid var(--black)', paddingBottom: '10px', marginBottom: '10px' }}>
                <Link to="/teams" style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: 'var(--gray-light)', border: '2px solid var(--black)', textDecoration: 'none', marginBottom: '5px' }}>Back to Teams</Link>
                <h2 style={{ margin: '5px 0' }}>{team.name} - Chat</h2>
                <div style={{ fontSize: '0.85em' }}>
                    <span style={{ marginRight: '15px' }}>Event: {team.event?.name}</span>
                    <span>Online: {onlineUsers.length} / {team.members.length}
                        {onlineUsers.length > 0 && <span style={{ color: 'var(--green)', marginLeft: '5px' }}>●</span>}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                    {team.members.map(m => (
                        <span key={m._id} style={{
                            fontSize: '0.8em', padding: '2px 8px', fontWeight: 'bold',
                            backgroundColor: onlineUsers.includes(m._id) ? 'var(--green)' : 'var(--gray-light)',
                            border: '1px solid var(--black)'
                        }}>{m.firstName}</span>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', backgroundColor: 'var(--gray-light)', border: '2px solid var(--black)' }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center' }}>No messages yet. Start the conversation!</p>
                ) : (
                    messages.map(msg => {
                        const senderId = msg.sender && msg.sender._id ? msg.sender._id : msg.sender;
                        const isMe = senderId === user.userId;
                        const renderContent = () => {
                            if (msg.type === 'file' && msg.fileUrl) {
                                const url = msg.fileUrl.startsWith('http') ? msg.fileUrl : `${API}${msg.fileUrl}`;
                                return (
                                    <div>
                                        <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--black)', fontWeight: 'bold', wordBreak: 'break-all' }}>
                                            {msg.fileName || msg.message || 'Download File'}
                                        </a>
                                    </div>
                                );
                            }
                            if (msg.type === 'link') {
                                return <a href={msg.message} target="_blank" rel="noreferrer" style={{ color: 'var(--black)', textDecoration: 'underline', wordBreak: 'break-all' }}>{msg.message}</a>;
                            }
                            // Auto-linkify URLs within text messages
                            const urlRegex = /(https?:\/\/[^\s]+)/g;
                            const parts = msg.message.split(urlRegex);
                            if (parts.length > 1) {
                                return <div>{parts.map((part, i) => urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: 'var(--black)', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a> : part)}</div>;
                            }
                            return <div>{msg.message}</div>;
                        };
                        return (
                            <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                                <div style={{
                                    maxWidth: '70%', padding: '8px 12px',
                                    backgroundColor: isMe ? 'var(--purple)' : 'var(--yellow-light)',
                                    border: '2px solid var(--black)'
                                }}>
                                    {!isMe && <div style={{ fontSize: '0.75em', marginBottom: '3px', fontWeight: 'bold' }}>{msg.sender?.firstName || 'Unknown'}</div>}
                                    {renderContent()}
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

            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                <input type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} placeholder="Type a message or paste a link..." style={{ flex: 1, fontSize: '1em' }} />
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '6px 10px', fontSize: '1.1em', backgroundColor: 'var(--gray-light)', border: '2px solid var(--black)', cursor: 'pointer' }} title="Share a file">
                    {uploading ? 'uploading' : 'attach'}
                </button>
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default TeamChat;

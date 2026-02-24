import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import API from '../../api';

const QRScanner = () => {
    const { eventId } = useParams();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [manualTicket, setManualTicket] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [scanning, setScanning] = useState(false);
    const [stats, setStats] = useState(null);
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);

    useEffect(() => {
        const fetchEvent = async () => { try { const r = await fetch(`${API}/api/events/${eventId}`); const d = await r.json(); if (r.ok) setEvent(d); } catch { console.error('Error'); } };
        fetchEvent(); fetchStats();
    }, [eventId]);

    const fetchStats = async () => {
        try { const r = await fetch(`${API}/api/attendance/event/${eventId}`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setStats(d); } catch (e) { console.error('Stats error:', e); }
    };

    const getTicketIdFromText = (text) => { let ticketId = text; try { const p = JSON.parse(text); if (p.ticketId) ticketId = p.ticketId; } catch {} return ticketId; };

    const processTicket = async (ticketId) => {
        setMessage({ text: '', type: '' }); setScanResult(null);
        try {
            const r = await fetch(`${API}/api/attendance/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ ticketId, eventId }) });
            const d = await r.json();
            if (r.ok) { setScanResult({ success: true, data: d }); setMessage({ text: `Attendance marked for ${d.user.firstName} ${d.user.lastName}`, type: 'success' }); fetchStats(); }
            else { setScanResult({ success: false, data: d }); setMessage({ text: d.message, type: 'error' }); }
        } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    const startScanner = () => {
        setScanning(true); setMessage({ text: '', type: '' });
        const html5Qr = new Html5Qrcode('qr-reader'); html5QrRef.current = html5Qr;
        html5Qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => { const t = getTicketIdFromText(decodedText); stopScanner(); processTicket(t); },
            () => {}
        ).catch(err => { console.error('Scanner error:', err); setMessage({ text: 'Could not start camera. Try manual entry or file upload.', type: 'error' }); setScanning(false); });
    };

    const stopScanner = () => { if (html5QrRef.current) { html5QrRef.current.stop().then(() => { html5QrRef.current.clear(); setScanning(false); }).catch(() => setScanning(false)); } else setScanning(false); };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return; setMessage({ text: '', type: '' });
        const html5Qr = new Html5Qrcode('qr-file-reader');
        try { const result = await html5Qr.scanFile(file, true); processTicket(getTicketIdFromText(result)); }
        catch { setMessage({ text: 'Could not read QR code from image', type: 'error' }); }
        finally { html5Qr.clear(); }
    };

    const handleManualScan = (e) => { e.preventDefault(); if (!manualTicket.trim()) return; processTicket(manualTicket.trim()); setManualTicket(''); };

    const handleManualOverride = async (registrationId) => {
        const note = prompt('Enter reason for manual override:'); if (!note) return;
        try {
            const r = await fetch(`${API}/api/attendance/manual`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ registrationId, note }) });
            const d = await r.json();
            if (r.ok) { setMessage({ text: 'Manual attendance marked', type: 'success' }); fetchStats(); }
            else setMessage({ text: d.message, type: 'error' });
        } catch { setMessage({ text: 'Server error', type: 'error' }); }
    };

    const handleExport = () => { window.open(`${API}/api/attendance/event/${eventId}/export?token=${user.token}`, '_blank'); };

    useEffect(() => { return () => { if (html5QrRef.current) html5QrRef.current.stop().catch(() => {}); }; }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <Link to={`/organizer/events/${eventId}`} style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: 'var(--gray-light)', border: '2px solid var(--black)', textDecoration: 'none', marginBottom: '10px' }}>
                Back to Event
            </Link>

            <h1>QR Scanner & Attendance</h1>
            {event && <p style={{ fontWeight: 'bold' }}>Event: {event.name}</p>}

            {message.text && (
                <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: message.type === 'success' ? 'var(--green)' : 'var(--red)', border: '2px solid var(--black)', fontWeight: 'bold' }}>
                    {message.text}
                    {scanResult && scanResult.success && <span style={{ marginLeft: '10px' }}>Ticket: {scanResult.data.ticketId}</span>}
                </div>
            )}

            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
                    <div style={{ padding: '15px', backgroundColor: 'var(--cyan)', border: '2px solid var(--black)', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 5px' }}>Total Registered</h4>
                        <p style={{ fontSize: '2em', margin: 0, fontWeight: 'bold' }}>{stats.total}</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: 'var(--green)', border: '2px solid var(--black)', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 5px' }}>Scanned</h4>
                        <p style={{ fontSize: '2em', margin: 0, fontWeight: 'bold' }}>{stats.attendedCount}</p>
                    </div>
                    <div style={{ padding: '15px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 5px' }}>Not Scanned</h4>
                        <p style={{ fontSize: '2em', margin: 0, fontWeight: 'bold' }}>{stats.notAttendedCount}</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div style={{ padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--white)' }}>
                    <h3 style={{ marginTop: 0 }}>Camera Scan</h3>
                    <div id="qr-reader" ref={scannerRef} style={{ width: '100%', marginBottom: '10px' }}></div>
                    {!scanning ? (
                        <button onClick={startScanner} style={{ width: '100%', padding: '10px 20px' }}>Start Camera</button>
                    ) : (
                        <button onClick={stopScanner} style={{ width: '100%', padding: '10px 20px', backgroundColor: 'var(--red)' }}>Stop Camera</button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--cyan)' }}>
                        <h3 style={{ marginTop: 0 }}>Upload QR Image</h3>
                        <div id="qr-file-reader" style={{ display: 'none' }}></div>
                        <input type="file" accept="image/*" onChange={handleFileUpload} />
                    </div>

                    <div style={{ padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' }}>
                        <h3 style={{ marginTop: 0 }}>Manual Entry</h3>
                        <form onSubmit={handleManualScan} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" placeholder="Enter Ticket ID" value={manualTicket} onChange={(e) => setManualTicket(e.target.value)} style={{ flex: 1 }} />
                            <button type="submit" style={{ backgroundColor: 'var(--green)' }}>Verify</button>
                        </form>
                    </div>
                </div>
            </div>

            {stats && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2>Attendance List</h2>
                        <button onClick={handleExport} style={{ backgroundColor: 'var(--yellow)' }}>Export CSV</button>
                    </div>

                    <h3>Not Yet Scanned ({stats.notAttendedCount})</h3>
                    {stats.notAttended.length === 0 ? (
                        <p>All participants have been scanned!</p>
                    ) : (
                        <table style={{ marginBottom: '25px' }}>
                            <thead>
                                <tr><th>Ticket ID</th><th>Name</th><th>Email</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {stats.notAttended.map(reg => (
                                    <tr key={reg._id}>
                                        <td style={{ fontFamily: 'monospace' }}>{reg.ticketId}</td>
                                        <td>{reg.user.firstName} {reg.user.lastName}</td>
                                        <td>{reg.user.email}</td>
                                        <td>
                                            <button onClick={() => handleManualOverride(reg._id)} style={{ fontSize: '0.85em', backgroundColor: 'var(--yellow)' }}>Manual Mark</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <h3>Scanned ({stats.attendedCount})</h3>
                    {stats.attended.length === 0 ? (
                        <p>No participants scanned yet.</p>
                    ) : (
                        <table>
                            <thead style={{ backgroundColor: 'var(--green)' }}>
                                <tr><th>Ticket ID</th><th>Name</th><th>Email</th><th>Scanned At</th><th>Note</th></tr>
                            </thead>
                            <tbody>
                                {stats.attended.map(reg => (
                                    <tr key={reg._id}>
                                        <td style={{ fontFamily: 'monospace' }}>{reg.ticketId}</td>
                                        <td>{reg.user.firstName} {reg.user.lastName}</td>
                                        <td>{reg.user.email}</td>
                                        <td>{new Date(reg.attendedAt).toLocaleString()}</td>
                                        <td style={{ fontSize: '0.85em' }}>{reg.attendanceNote || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default QRScanner;
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const OrgEventDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [filteredRegs, setFilteredRegs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventRes = await fetch(`${API}/api/events/${id}`);
                const eventData = await eventRes.json();
                if (eventRes.ok) setEvent(eventData);

                const regRes = await fetch(`${API}/api/events/${id}/registrations`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const regData = await regRes.json();
                if (regRes.ok) {
                    setRegistrations(regData);
                    setFilteredRegs(regData);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user.token]);

    useEffect(() => {
        var filtered = registrations;
        if (searchTerm) {
            filtered = filtered.filter(reg =>
                reg.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reg.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reg.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reg.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== 'All') {
            filtered = filtered.filter(reg => reg.status === statusFilter);
        }
        setFilteredRegs(filtered);
    }, [searchTerm, statusFilter, registrations]);

    const downloadCSV = () => {
        const formFields = event.customForm || [];
        const baseHeaders = ['Ticket ID', 'Name', 'Email', 'Contact', 'College', 'Reg Date', 'Fee', 'Attended', 'Status'];
        const formHeaders = formFields.map(f => f.label);
        const headers = [...baseHeaders, ...formHeaders];

        const rows = filteredRegs.map(reg => {
            const formData = reg.formData || {};
            const baseRow = [
                reg.ticketId,
                `${reg.user.firstName} ${reg.user.lastName}`,
                reg.user.email,
                reg.user.contactNumber || 'N/A',
                reg.user.collegeName || 'N/A',
                new Date(reg.registrationDate).toLocaleString(),
                event.fee > 0 ? `Rs. ${event.fee}` : 'Free',
                reg.attended ? 'Yes' : 'No',
                reg.status
            ];
            const formRow = formFields.map(f => {
                const val = formData[f.label] || '';
                if (f.type === 'file' && val) {
                    return val.startsWith('http') ? val : `${API}${val}`;
                }
                return val;
            });
            return [...baseRow, ...formRow];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `registrations_${event.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (!event) return <div style={{ padding: '20px' }}>Event not found</div>;

    const totalRegistrations = registrations.length;
    const confirmedRegs = registrations.filter(r => r.status === 'Confirmed').length;
    const cancelledRegs = registrations.filter(r => r.status === 'Cancelled').length;
    const totalRevenue = confirmedRegs * (event.fee || 0);
    const attendedCount = registrations.filter(r => r.attended).length;
    const formFields = event.customForm || [];
    const hasForm = formFields.length > 0;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <Link to="/organizer/dashboard" style={{ marginBottom: '20px', display: 'inline-block', padding: '6px 12px', border: '2px solid #000', textDecoration: 'none', backgroundColor: '#fff' }}>&lArr; Back to Dashboard</Link>

            <div style={{ borderBottom: '3px solid #000', paddingBottom: '20px', marginBottom: '20px', marginTop: '10px' }}>
                <h1 style={{ marginBottom: '5px' }}>{event.name}</h1>
                <p style={{ margin: '5px 0' }}>
                    <strong>Status:</strong> {event.status} | <strong>Type:</strong> {event.type} | <strong>Eligibility:</strong> {event.eligibility || 'All'}
                </p>
                <p style={{ margin: '5px 0' }}>
                    <strong>Dates:</strong> {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                </p>
                <p style={{ margin: '5px 0' }}>
                    <strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleString()}
                    {event.registrationLimit > 0 && <> | <strong>Capacity:</strong> {event.registeredCount || 0} / {event.registrationLimit}</>}
                </p>
                {event.fee > 0 && <p style={{ margin: '5px 0' }}><strong>Fee:</strong> Rs. {event.fee}</p>}
                <div style={{ marginTop: '10px' }}>
                    <Link to={`/organizer/events/${id}/scanner`} style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: '#ff6a3d', color: '#000', textDecoration: 'none', fontWeight: 'bold', border: '2px solid #000' }}>
                        Scan Attendance
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '30px' }}>
                {[
                    { label: 'Registrations', value: totalRegistrations },
                    { label: 'Confirmed', value: confirmedRegs },
                    { label: 'Cancelled', value: cancelledRegs },
                    { label: 'Revenue', value: `Rs. ${totalRevenue}` },
                    { label: 'Attended', value: attendedCount },
                ].map(s => (
                    <div key={s.label} style={{ padding: '15px', border: '2px solid #000', textAlign: 'center', backgroundColor: '#fff' }}>
                        <div style={{ fontSize: '0.85em', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '30px' }}>
                <h3>Description</h3>
                <p>{event.description}</p>
            </div>

            {/* Custom Form notice */}
            {hasForm && (
                <div style={{ marginBottom: '20px', padding: '12px', border: '2px solid #000', backgroundColor: '#fdef26' }}>
                    <strong>Custom form fields:</strong> {formFields.map(f => f.label).join(', ')}
                    <br /><span style={{ fontSize: '0.85em' }}>Responses shown in table. File uploads have a Download link.</span>
                </div>
            )}

            {/* Participants Table */}
            <div style={{ marginBottom: '30px' }}>
                <h3>Participants ({filteredRegs.length})</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search participants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '220px' }}
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
                        <option value="All">All Status</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Pending">Pending</option>
                    </select>
                    <button onClick={downloadCSV} style={{ backgroundColor: '#ff6a3d', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer', padding: '6px 12px' }}>
                        Export CSV
                    </button>
                </div>

                {filteredRegs.length === 0 ? <p>No registrations found.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Reg Date</th>
                                    <th>Fee</th>
                                    <th>Attended</th>
                                    <th>Status</th>
                                    {formFields.map(f => <th key={f.label}>{f.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRegs.map(reg => {
                                    const formData = reg.formData || {};
                                    return (
                                        <tr key={reg._id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{reg.ticketId}</td>
                                            <td>{reg.user.firstName} {reg.user.lastName}</td>
                                            <td>{reg.user.email}</td>
                                            <td>{new Date(reg.registrationDate).toLocaleDateString()}</td>
                                            <td>{event.fee > 0 ? `Rs. ${event.fee}` : 'Free'}</td>
                                            <td>{reg.attended ? 'Yes' : 'No'}</td>
                                            <td>{reg.status}</td>
                                            {formFields.map(f => {
                                                const val = formData[f.label] || '';
                                                if (f.type === 'file' && val) {
                                                    // val may be a full URL or a relative path
                                                    const url = val.startsWith('http') ? val : `${API}${val}`;
                                                    return (
                                                        <td key={f.label}>
                                                            <a href={url} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
                                                                Download
                                                            </a>
                                                        </td>
                                                    );
                                                }
                                                return <td key={f.label}>{val || '—'}</td>;
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrgEventDetail;

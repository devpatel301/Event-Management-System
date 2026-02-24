import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

const EditEvent = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [hasRegistrations, setHasRegistrations] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [originalStatus, setOriginalStatus] = useState('Draft');

    const [formData, setFormData] = useState({
        name: '', description: '', type: 'Normal', eligibility: 'All',
        startDate: '', endDate: '', registrationDeadline: '',
        registrationLimit: 0, fee: 0, tags: '', status: 'Draft'
    });

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`${API}/api/events/${id}`);
            const data = await res.json();
            if (res.ok) {
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    type: data.type || 'Normal',
                    eligibility: data.eligibility || 'All',
                    startDate: data.startDate ? data.startDate.slice(0, 16) : '',
                    endDate: data.endDate ? data.endDate.slice(0, 16) : '',
                    registrationDeadline: data.registrationDeadline ? data.registrationDeadline.slice(0, 16) : '',
                    registrationLimit: data.registrationLimit || 0,
                    fee: data.fee || 0,
                    tags: (data.tags || []).join(', '),
                    status: data.status || 'Draft'
                });
                setOriginalStatus(data.status || 'Draft');
                setHasRegistrations((data.registeredCount || 0) > 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isDraft = originalStatus === 'Draft';
    const isPublished = originalStatus === 'Published';
    const isOngoingOrLocked = ['Ongoing', 'Completed', 'Closed', 'Cancelled'].includes(originalStatus);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        try {
            let payload;

            if (isDraft) {
                payload = { ...formData, tags: formData.tags.split(',').map(t => t.trim()) };
            } else if (isPublished) {
                // Published: only description, deadline, limit, tags, status
                payload = {
                    description: formData.description,
                    registrationDeadline: formData.registrationDeadline,
                    registrationLimit: parseInt(formData.registrationLimit) || 0,
                    tags: formData.tags.split(',').map(t => t.trim()),
                    status: formData.status
                };
            } else {
                // Ongoing/Completed/Closed: only status
                payload = { status: formData.status };
            }

            const response = await fetch(`${API}/api/events/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage({ text: 'Event updated! Redirecting...', type: 'success' });
                setTimeout(() => navigate('/organizer/dashboard'), 1500);
            } else {
                const data = await response.json();
                setMessage({ text: data.message || 'Update failed', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Server error', type: 'error' });
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            <h1>Edit Event</h1>
            {message.text && (
                <p style={{ padding: '10px', marginBottom: '15px', backgroundColor: message.type === 'success' ? 'var(--green)' : 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)', fontWeight: 'bold' }}>{message.text}</p>
            )}
            {!isDraft && !isOngoingOrLocked && (
                <div style={{ padding: '10px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', marginBottom: '20px' }}>
                    <strong>Note:</strong> This event is Published. Only description, deadline, limit, tags and status can be edited.
                </div>
            )}
            {isOngoingOrLocked && (
                <div style={{ padding: '10px', backgroundColor: 'var(--red)', border: '2px solid var(--black)', marginBottom: '20px', fontWeight: 'bold' }}>
                    <strong>Restricted:</strong> This event is {originalStatus}. Only the status field can be changed.
                </div>
            )}
            {hasRegistrations && (
                <div style={{ padding: '10px', backgroundColor: 'var(--red)', border: '2px solid var(--black)', marginBottom: '20px', fontWeight: 'bold' }}>
                    <strong>Warning:</strong> This event has registrations. Custom form fields are locked.
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                <div>
                    <label>Event Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!isDraft || isOngoingOrLocked} required />
                </div>
                <div>
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} disabled={isOngoingOrLocked} required style={{ minHeight: '100px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label>Event Type</label>
                        <input type="text" value={formData.type} disabled style={{ backgroundColor: 'var(--gray-light)' }} />
                    </div>
                    <div>
                        <label>Eligibility</label>
                        <input type="text" value={formData.eligibility} disabled={!isDraft || isOngoingOrLocked} style={{ backgroundColor: isDraft && !isOngoingOrLocked ? 'var(--white)' : 'var(--gray-light)' }} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                        <div><label>Start Date & Time</label><input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} disabled={!isDraft || isOngoingOrLocked} /></div>
                    </div>
                    <div>
                        <div><label>End Date & Time</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} disabled={!isDraft || isOngoingOrLocked} /></div>
                    </div>
                    <div>
                        <div><label>Reg Deadline</label><input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} disabled={isOngoingOrLocked} /></div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label>Limit (0 = unlimited)</label>
                        <input type="number" name="registrationLimit" value={formData.registrationLimit} onChange={handleChange} disabled={isOngoingOrLocked} />
                    </div>
                    <div>
                        <label>Fee</label>
                        <input type="number" name="fee" value={formData.fee} disabled={!isDraft || isOngoingOrLocked} style={{ backgroundColor: isDraft && !isOngoingOrLocked ? 'var(--white)' : 'var(--gray-light)' }} />
                    </div>
                </div>
                <div>
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                        {originalStatus === 'Draft' && <><option value="Draft">Draft</option><option value="Published">Published</option></>}
                        {originalStatus === 'Published' && <><option value="Published">Published</option><option value="Ongoing">Ongoing</option><option value="Cancelled">Cancelled</option></>}
                        {originalStatus === 'Ongoing' && <><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></>}
                        {(originalStatus === 'Completed' || originalStatus === 'Closed' || originalStatus === 'Cancelled') && <option value={originalStatus}>{originalStatus}</option>}
                    </select>
                </div>
                <div>
                    <label>Tags (comma separated)</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleChange} disabled={isOngoingOrLocked} />
                </div>
                <button type="submit" style={{ padding: '15px', fontSize: '1.1em' }}>
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default EditEvent;

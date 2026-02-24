import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const CreateEvent = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [message, setMessage] = useState({ text: '', type: '' });
    const [organizerProfile, setOrganizerProfile] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '', description: '', type: 'Normal', eligibility: 'All',
        startDate: '', endDate: '', registrationDeadline: '',
        registrationLimit: '', fee: '0', tags: '', status: 'Draft'
    });

    const [customForm, setCustomForm] = useState([]);
    const [merchandiseItems, setMerchandiseItems] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try { const r = await fetch(`${API}/api/users/profile`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setOrganizerProfile(d); } catch (e) { console.error(e); }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const addFormField = () => { setCustomForm([...customForm, { label: '', type: 'text', required: false, options: [] }]); };
    const updateFormField = (i, f, v) => { const u = [...customForm]; u[i][f] = v; setCustomForm(u); };
    const removeFormField = (i) => { setCustomForm(customForm.filter((_, idx) => idx !== i)); };
    const moveFieldUp = (i) => { if (i === 0) return; const u = [...customForm]; [u[i-1], u[i]] = [u[i], u[i-1]]; setCustomForm(u); };
    const moveFieldDown = (i) => { if (i === customForm.length - 1) return; const u = [...customForm]; [u[i], u[i+1]] = [u[i+1], u[i]]; setCustomForm(u); };
    const addOption = (fi) => { const u = [...customForm]; if (!u[fi].options) u[fi].options = []; u[fi].options.push(''); setCustomForm(u); };
    const updateOption = (fi, oi, v) => { const u = [...customForm]; u[fi].options[oi] = v; setCustomForm(u); };
    const removeOption = (fi, oi) => { const u = [...customForm]; u[fi].options = u[fi].options.filter((_, i) => i !== oi); setCustomForm(u); };

    const addMerchItem = () => { setMerchandiseItems([...merchandiseItems, { name: '', price: 0, stock: 0, description: '', purchaseLimit: 0 }]); };
    const updateMerchItem = (i, f, v) => { const u = [...merchandiseItems]; u[i][f] = v; setMerchandiseItems(u); };
    const removeMerchItem = (i) => { setMerchandiseItems(merchandiseItems.filter((_, idx) => idx !== i)); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        if (!formData.name.trim()) { setMessage({ text: 'Event Name is required', type: 'error' }); return; }
        if (!formData.description.trim()) { setMessage({ text: 'Description is required', type: 'error' }); return; }
        if (!formData.startDate) { setMessage({ text: 'Start Date is required', type: 'error' }); return; }
        if (!formData.endDate) { setMessage({ text: 'End Date is required', type: 'error' }); return; }
        if (!formData.registrationDeadline) { setMessage({ text: 'Deadline is required', type: 'error' }); return; }
        if (!formData.registrationLimit && formData.registrationLimit !== '0') { setMessage({ text: 'Registration Limit is required', type: 'error' }); return; }
        if (!formData.tags.trim()) { setMessage({ text: 'At least one tag is required', type: 'error' }); return; }

        try {
            const payload = {
                ...formData,
                registrationLimit: parseInt(formData.registrationLimit) || 0,
                fee: parseInt(formData.fee) || 0,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                customForm, merchandiseItems: formData.type === 'Merchandise' ? merchandiseItems : [],
                minTeamSize: formData.type === 'Hackathon' ? parseInt(formData.minTeamSize) || 2 : undefined,
                maxTeamSize: formData.type === 'Hackathon' ? parseInt(formData.maxTeamSize) || 4 : undefined
            };
            const r = await fetch(`${API}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify(payload) });
            const d = await r.json();
            if (r.ok) { setMessage({ text: 'Event created! Redirecting...', type: 'success' }); setTimeout(() => navigate('/organizer/dashboard'), 1500); }
            else { setMessage({ text: d.message || 'Failed', type: 'error' }); }
        } catch (e) { setMessage({ text: 'Server error.', type: 'error' }); }
    };

    const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', border: '2px solid var(--black)' };
    const labelStyle = { display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9em', color: 'var(--black)' };
    const needsOptions = (t) => t === 'dropdown' || t === 'radio' || t === 'checkbox';

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
            <h1 style={{ color: 'var(--black)' }}>Create New Event</h1>

            {message.text && (
                <p style={{ padding: '10px', margin: '0 0 15px 0', backgroundColor: message.type === 'success' ? 'var(--green)' : 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)' }}>{message.text}</p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                
                <div style={{ padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--white)' }}>
                    <h3 style={{ marginTop: 0 }}>Basic Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div><label style={labelStyle}>Event Name *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} /></div>
                        <div><label style={labelStyle}>Event Type *</label>
                            <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                                <option value="Normal">Normal Event</option><option value="Merchandise">Merchandise</option><option value="Hackathon">Hackathon (Team)</option>
                            </select>
                        </div>
                        <div><label style={labelStyle}>Eligibility *</label>
                            <select name="eligibility" value={formData.eligibility} onChange={handleChange} style={inputStyle}>
                                <option value="All">Open to All</option><option value="IIIT Students">IIIT Students Only</option>
                            </select>
                        </div>
                        <div><label style={labelStyle}>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                                <option value="Draft">Draft</option><option value="Published">Published</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: '15px' }}><label style={labelStyle}>Description *</label><textarea name="description" value={formData.description} onChange={handleChange} required style={{ ...inputStyle, minHeight: '100px' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div><label style={labelStyle}>Start Date & Time *</label><input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required style={inputStyle} /></div>
                        <div><label style={labelStyle}>End Date & Time *</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required style={inputStyle} /></div>
                        <div><label style={labelStyle}>Deadline *</label><input type="datetime-local" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required style={inputStyle} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div><label style={labelStyle}>Registration Limit *</label><input type="number" name="registrationLimit" value={formData.registrationLimit} onChange={handleChange} required min="0" style={inputStyle} placeholder="0 = unlimited" /></div>
                        <div><label style={labelStyle}>Fee (Rs.) *</label><input type="number" name="fee" value={formData.fee} onChange={handleChange} required min="0" style={inputStyle} /></div>
                    </div>
                    {formData.type === 'Hackathon' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                            <div><label style={labelStyle}>Min Team Size</label><input type="number" name="minTeamSize" value={formData.minTeamSize || 2} onChange={handleChange} min="2" style={inputStyle} /></div>
                            <div><label style={labelStyle}>Max Team Size</label><input type="number" name="maxTeamSize" value={formData.maxTeamSize || 4} onChange={handleChange} min="2" style={inputStyle} /></div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div><label style={labelStyle}>Tags * (comma separated)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} required style={inputStyle} placeholder="e.g. tech, fun, coding" /></div>
                        <div><label style={labelStyle}>Organizer ID</label><input type="text" value={organizerProfile?.organizerId || 'Loading...'} disabled style={{ ...inputStyle, backgroundColor: 'var(--yellow)' }} /></div>
                    </div>
                </div>

                {/* Form Builder */}
                <div style={{ padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--white)' }}>
                    <h3 style={{ marginTop: 0 }}>Registration Form Builder</h3>
                    <p style={{ fontSize: '0.9em', color: 'var(--black)', marginTop: 0 }}>Add custom questions for participants.</p>
                    
                    {customForm.map((field, index) => (
                        <div key={index} style={{ border: '2px solid var(--black)', padding: '15px', marginBottom: '10px', backgroundColor: 'var(--gray-light)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <strong>Field #{index + 1}</strong>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button type="button" onClick={() => moveFieldUp(index)} disabled={index === 0} style={{ padding: '4px 8px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>Up</button>
                                    <button type="button" onClick={() => moveFieldDown(index)} disabled={index === customForm.length - 1} style={{ padding: '4px 8px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>Down</button>
                                    <button type="button" onClick={() => removeFormField(index)} style={{ color: 'var(--black)', backgroundColor: 'var(--red)', border: '2px solid var(--black)', padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 80px', gap: '10px', marginBottom: '10px' }}>
                                <div><label style={{ fontSize: '0.85em', display: 'block', marginBottom: '2px' }}>Question / Label</label>
                                    <input type="text" placeholder="e.g. What is your T-shirt size?" value={field.label} onChange={(e) => updateFormField(index, 'label', e.target.value)} style={{ width: '100%', padding: '6px', border: '2px solid var(--black)', boxSizing: 'border-box' }} />
                                </div>
                                <div><label style={{ fontSize: '0.85em', display: 'block', marginBottom: '2px' }}>Field Type</label>
                                    <select value={field.type} onChange={(e) => { updateFormField(index, 'type', e.target.value); if (!needsOptions(e.target.value)) updateFormField(index, 'options', []); }}
                                        style={{ width: '100%', padding: '6px', border: '2px solid var(--black)' }}>
                                        <option value="text">Text Input</option><option value="number">Number</option><option value="dropdown">Dropdown</option><option value="radio">Radio Buttons</option><option value="checkbox">Checkboxes</option><option value="file">File Upload</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><label style={{ fontSize: '0.85em', marginBottom: 0 }}>Required</label>
                                    <input type="checkbox" checked={field.required} onChange={(e) => updateFormField(index, 'required', e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
                                </div>
                            </div>

                            {needsOptions(field.type) && (
                                <div style={{ marginTop: '10px', padding: '10px', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' }}>
                                    <label style={{ fontSize: '0.85em', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Options for {field.type}:</label>
                                    {(field.options || []).map((opt, optIdx) => (
                                        <div key={optIdx} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                                            <span style={{ minWidth: '20px', fontSize: '0.85em' }}>{optIdx + 1}.</span>
                                            <input type="text" value={opt} onChange={(e) => updateOption(index, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`}
                                                style={{ flex: 1, padding: '5px', border: '2px solid var(--black)', boxSizing: 'border-box' }} />
                                            <button type="button" onClick={() => removeOption(index, optIdx)} style={{ padding: '4px 8px', backgroundColor: 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addOption(index)} style={{ padding: '4px 12px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>+ Add Option</button>
                                </div>
                            )}

                        </div>
                    ))}
                    <button type="button" onClick={addFormField} style={{ padding: '8px 16px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Question</button>
                </div>

                {formData.type === 'Merchandise' && (
                    <div style={{ padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--purple)' }}>
                        <h3 style={{ marginTop: 0 }}>Merchandise Items</h3>
                        {merchandiseItems.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                                <thead><tr style={{ backgroundColor: 'var(--yellow)' }}>
                                    <th style={{ padding: '8px', border: '2px solid var(--black)' }}>Item Name</th>
                                    <th style={{ padding: '8px', border: '2px solid var(--black)', width: '100px' }}>Price</th>
                                    <th style={{ padding: '8px', border: '2px solid var(--black)', width: '80px' }}>Stock</th>
                                    <th style={{ padding: '8px', border: '2px solid var(--black)', width: '90px' }}>Buy Limit</th>
                                    <th style={{ padding: '8px', border: '2px solid var(--black)' }}>Description</th>
                                    <th style={{ padding: '8px', border: '2px solid var(--black)', width: '40px' }}></th>
                                </tr></thead>
                                <tbody>{merchandiseItems.map((item, i) => (
                                    <tr key={i}><td style={{ padding: '4px', border: '1px solid var(--black)' }}><input type="text" placeholder="e.g. T-Shirt" value={item.name} onChange={(e) => updateMerchItem(i, 'name', e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                                    <td style={{ padding: '4px', border: '1px solid var(--black)' }}><input type="number" value={item.price} onChange={(e) => updateMerchItem(i, 'price', e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                                    <td style={{ padding: '4px', border: '1px solid var(--black)' }}><input type="number" value={item.stock} onChange={(e) => updateMerchItem(i, 'stock', e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                                    <td style={{ padding: '4px', border: '1px solid var(--black)' }}><input type="number" min="0" placeholder="0=no limit" value={item.purchaseLimit} onChange={(e) => updateMerchItem(i, 'purchaseLimit', e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                                    <td style={{ padding: '4px', border: '1px solid var(--black)' }}><input type="text" value={item.description} onChange={(e) => updateMerchItem(i, 'description', e.target.value)} style={{ ...inputStyle, width: '100%' }} /></td>
                                    <td style={{ padding: '4px', border: '1px solid var(--black)', textAlign: 'center' }}><button type="button" onClick={() => removeMerchItem(i)} style={{ backgroundColor: 'var(--red)', border: '2px solid var(--black)', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold' }}>X</button></td></tr>
                                ))}</tbody>
                            </table>
                        )}
                        <button type="button" onClick={addMerchItem} style={{ padding: '8px 16px', backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Item</button>
                    </div>
                )}

                <div><button type="submit" style={{ padding: '15px 30px', fontSize: '1.2em' }}>Create Event</button></div>
            </form>
        </div>
    );
};

export default CreateEvent;

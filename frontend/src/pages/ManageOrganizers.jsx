import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../api';

const ManageOrganizers = () => {
  const { user } = useContext(AuthContext);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', category: '', description: '' });
  const [resetPasswordFor, setResetPasswordFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { fetchOrganizers(); }, []);

  const fetchOrganizers = async () => {
    try {
      const r = await fetch(`${API}/api/admin/organizers`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      const d = await r.json();
      if (r.ok) setOrganizers(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm({ ...form, password: pass });
  };

  const generateEmail = () => {
    if (!form.name) { setMessage({ text: 'Please enter a name first.', type: 'error' }); return; }
    const sanitized = form.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setForm({ ...form, email: `${sanitized}@clubs.iiit.ac.in` });
  };

  const archiveOrganizer = async (id) => {
    try {
      const r = await fetch(`${API}/api/admin/organizers/${id}/archive`, { method: 'PUT', headers: { 'Authorization': `Bearer ${user.token}` } });
      const d = await r.json();
      if (r.ok) { setMessage({ text: d.message, type: 'success' }); fetchOrganizers(); }
      else { setMessage({ text: d.message || 'Failed', type: 'error' }); }
    } catch (e) { setMessage({ text: 'Server error', type: 'error' }); }
  };

  const addOrganizer = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const r = await fetch(`${API}/api/admin/organizers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify(form) });
      const d = await r.json();
      if (r.ok) { setMessage({ text: `Organizer created! Email: ${form.email} | Password: ${form.password}`, type: 'success' }); setForm({ name: '', email: '', password: '', category: '', description: '' }); fetchOrganizers(); }
      else { setMessage({ text: d.message || 'Failed', type: 'error' }); }
    } catch (e) { setMessage({ text: 'Server error', type: 'error' }); }
  };

  const deleteOrganizer = async (id) => {
    if (!window.confirm('Delete this organizer and all their events?')) return;
    try {
      const r = await fetch(`${API}/api/admin/organizers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.token}` } });
      if (r.ok) { setMessage({ text: 'Organizer deleted.', type: 'success' }); fetchOrganizers(); }
    } catch (e) { setMessage({ text: 'Server error', type: 'error' }); }
  };

  const resetPassword = async (id) => {
    if (!newPassword || newPassword.length < 6) { setMessage({ text: 'Password must be at least 6 chars.', type: 'error' }); return; }
    try {
      const r = await fetch(`${API}/api/admin/organizers/${id}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ newPassword }) });
      if (r.ok) { setMessage({ text: 'Password reset.', type: 'success' }); setResetPasswordFor(null); setNewPassword(''); }
      else { setMessage({ text: 'Reset failed', type: 'error' }); }
    } catch (e) { setMessage({ text: 'Server error', type: 'error' }); }
  };

  if (loading) return <div style={{ padding: '20px', minHeight: '100vh' }}>Loading...</div>;

  const inputStyle = { padding: '8px', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ color: 'var(--black)' }}>Manage Organizers</h1>

      <div style={{ border: '2px solid var(--black)', padding: '20px', marginBottom: '20px', backgroundColor: 'var(--gray-light)' }}>
        <h3 style={{ marginTop: 0 }}>Add New Organizer</h3>
        <form onSubmit={addOrganizer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input type="text" name="name" placeholder="Organization Name *" value={form.name} onChange={handleChange} required style={inputStyle} />
          <div style={{ display: 'flex', gap: '5px' }}>
            <input type="email" name="email" placeholder="Contact Email *" value={form.email} onChange={handleChange} required style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={generateEmail} style={{ padding: '8px', cursor: 'pointer', backgroundColor: 'var(--cyan)', color: 'var(--black)', border: '2px solid var(--black)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Gen Email</button>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input type="text" name="password" placeholder="Password *" value={form.password} onChange={handleChange} required style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={generatePassword} style={{ padding: '8px', cursor: 'pointer', backgroundColor: 'var(--yellow)', color: 'var(--black)', border: '2px solid var(--black)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Generate</button>
          </div>
          <select name="category" value={form.category} onChange={handleChange} required style={inputStyle}>
            <option value="">-- Select Organizer Type * --</option>
            <option value="Clubs">Clubs</option>
            <option value="Councils">Councils</option>
            <option value="Fest Teams">Fest Teams</option>
            <option value="Cultural">Cultural</option>
            <option value="Technical">Technical</option>
            <option value="Sports">Sports</option>
            <option value="Other">Other</option>
          </select>
          <input type="text" name="description" placeholder="Description *" value={form.description} onChange={handleChange} required style={{ ...inputStyle, gridColumn: '1 / -1' }} />
          <button type="submit" style={{ padding: '10px', backgroundColor: 'var(--yellow)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', gridColumn: '1 / -1', fontWeight: 'bold', fontSize: '1em' }}>Add Organizer</button>
        </form>
      </div>

      {message.text && <p style={{ padding: '10px', margin: '10px 0', backgroundColor: message.type === 'success' ? 'var(--green)' : 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)' }}>{message.text}</p>}

      <h3>Existing Organizers ({organizers.length})</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--black)' }}>
        <thead style={{ backgroundColor: 'var(--yellow)' }}>
          <tr>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--black)' }}>ID</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--black)' }}>Name</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--black)' }}>Email</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--black)' }}>Category</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--black)' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid var(--black)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {organizers.map((org, i) => (
            <tr key={org._id} style={{ borderBottom: '1px solid var(--black)', backgroundColor:'var(--white)'}}>
              <td style={{ padding: '10px', fontFamily: 'monospace', border: '1px solid var(--black)' }}>{org.organizerId || 'N/A'}</td>
              <td style={{ padding: '10px', border: '1px solid var(--black)' }}>{org.name}</td>
              <td style={{ padding: '10px', border: '1px solid var(--black)' }}>{org.email}</td>
              <td style={{ padding: '10px', border: '1px solid var(--black)' }}>{org.category || 'N/A'}</td>
              <td style={{ padding: '10px', border: '1px solid var(--black)' }}>
                <span style={{ padding: '2px 8px', fontWeight: 'bold', border: '1px solid var(--black)', backgroundColor: org.archived ? 'var(--red)' : 'var(--green)' }}>{org.archived ? 'Archived' : 'Active'}</span>
              </td>
              <td style={{ padding: '10px', border: '1px solid var(--black)' }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button onClick={() => archiveOrganizer(org._id)} style={{ padding: '5px 10px', backgroundColor: org.archived ? 'var(--green)' : 'var(--gray-light)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>{org.archived ? 'Unarchive' : 'Archive'}</button>
                  <button onClick={() => { setResetPasswordFor(resetPasswordFor === org._id ? null : org._id); setNewPassword(''); }} style={{ padding: '5px 10px', backgroundColor: 'var(--yellow)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>Reset PW</button>
                  <button onClick={() => deleteOrganizer(org._id)} style={{ padding: '5px 10px', backgroundColor: 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                </div>
                {resetPasswordFor === org._id && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                    <input type="text" placeholder="New password (min 6)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => resetPassword(org._id)} style={{ padding: '5px 10px', backgroundColor: 'var(--yellow)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontWeight: 'bold' }}>Set</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageOrganizers;

import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../api';

const PasswordResetSection = ({ token }) => {
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [msg, setMsg] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API}/api/password-resets/my`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setRequests(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const submitRequest = async () => {
    if (!reason.trim()) return;
    setMsg('');
    try {
      const res = await fetch(`${API}/api/password-resets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) { setMsg('Request submitted!'); setReason(''); fetchRequests(); }
      else { setMsg(data.message || 'Failed'); }
    } catch (err) { setMsg('Server error'); }
  };

  const statusColor = (s) => s === 'Approved' ? '#c1ffca' : s === 'Rejected' ? '#ff7676' : '#fdef26';

  return (
    <div style={{ border: '2px solid #000', padding: '15px', marginBottom: '20px', backgroundColor: '#ffd6a5' }}>
      <h4 style={{ marginTop: 0 }}>Request Password Reset</h4>
      <p style={{ fontSize: '0.85em', color: '#000' }}>Submit a request and an admin will generate a new one.</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for reset..."
        style={{ width: '100%', padding: '8px', border: '2px solid #000', minHeight: '60px', boxSizing: 'border-box', marginBottom: '8px', backgroundColor: '#efefe2' }} />
      <button onClick={submitRequest} style={{ padding: '8px 16px', backgroundColor: '#ff7676', color: '#000', border: '2px solid #000', cursor: 'pointer', fontWeight: 'bold' }}>Submit Request</button>
      {msg && <p style={{ marginTop: '8px', color: '#000', fontWeight: 'bold' }}>{msg}</p>}
      {requests.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h5>My Requests</h5>
          {requests.map(req => (
            <div key={req._id} style={{ padding: '8px', border: '1px solid #000', marginBottom: '5px', fontSize: '0.9em', backgroundColor: '#ffd6a5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{req.reason}</span>
                <span style={{ backgroundColor: statusColor(req.status), padding: '2px 8px', fontWeight: 'bold', border: '1px solid #000' }}>{req.status}</span>
              </div>
              {req.adminComment && <p style={{ margin: '4px 0 0', color: '#000', fontSize: '0.85em' }}>Admin: {req.adminComment}</p>}
              <p style={{ margin: '2px 0 0', color: '#000', fontSize: '0.8em' }}>{new Date(req.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });

  const isOrganizer = user?.role === 'organizer';

  const interestsList = [
    'Coding', 'Design', 'Music', 'Dance', 'Photography',
    'Literature', 'Gaming', 'Research', 'Sports', 'Robotics',
    'AI/ML', 'Cybersecurity', 'Entrepreneurship', 'Dramatics'
  ];

  const [organizers, setOrganizers] = useState([]);
  
  useEffect(() => { if (user) { fetchProfile(); fetchOrganizers(); } }, [user]);

  const fetchOrganizers = async () => {
    try { const r = await fetch(`${API}/api/organizers`); const d = await r.json(); if (r.ok) setOrganizers(d); } catch (e) { console.error(e); }
  };

  const fetchProfile = async () => {
    try { const r = await fetch(`${API}/api/users/profile`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setProfile(d); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleChange = (e) => { setProfile({ ...profile, [e.target.name]: e.target.value }); };

  const toggleInterest = (interest) => {
    const current = profile.interests || [];
    setProfile({ ...profile, interests: current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest] });
  };

  const toggleClub = (orgId) => {
    const current = profile.followedClubs || [];
    setProfile({ ...profile, followedClubs: current.includes(orgId) ? current.filter(id => id !== orgId) : [...current, orgId] });
  };

  const handlePasswordChange = (e) => { setPasswords({ ...passwords, [e.target.name]: e.target.value }); };

  const updateProfile = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    try {
      const body = isOrganizer
        ? { name: profile.name, desc: profile.desc, category: profile.category, contactNumber: profile.contactNumber }
        : { firstName: profile.firstName, lastName: profile.lastName, contactNumber: profile.contactNumber, collegeName: profile.collegeName, interests: profile.interests, followedClubs: profile.followedClubs };
      const r = await fetch(`${API}/api/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify(body) });
      if (r.ok) { setMessage({ text: 'Profile updated!', type: 'success' }); setEditing(false); }
      else { setMessage({ text: 'Failed to update.', type: 'error' }); }
    } catch (e) { setMessage({ text: 'Server error.', type: 'error' }); }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ text: '', type: '' });
    if (passwords.newPassword !== passwords.confirmPassword) { setPwMsg({ text: 'Passwords do not match.', type: 'error' }); return; }
    try {
      const r = await fetch(`${API}/api/users/profile/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) });
      const d = await r.json();
      if (r.ok) { setPwMsg({ text: 'Password updated!', type: 'success' }); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else { setPwMsg({ text: d.message || 'Failed.', type: 'error' }); }
    } catch (e) { setPwMsg({ text: 'Server error.', type: 'error' }); }
  };

  if (loading) return <div style={{ padding: '20px', backgroundColor: '#fff9e0', minHeight: '100vh' }}>Loading...</div>;
  if (!profile) return <div style={{ padding: '20px', backgroundColor: '#fff9e0', minHeight: '100vh' }}>Profile not found</div>;

  const fieldStyle = { width: '100%', padding: '8px', display: 'block', border: '2px solid #000', boxSizing: 'border-box', backgroundColor: '#efefe2' };
  const disabledStyle = { ...fieldStyle, backgroundColor: '#f3e8ff' };
  const msgStyle = (type) => ({ padding: '10px', margin: '10px 0', backgroundColor: type === 'success' ? '#c1ffca' : '#ff7676', color: '#000', border: '2px solid #000' });

  const chipStyle = (selected) => ({
    padding: '6px 12px', border: '2px solid #000',
    backgroundColor: selected ? '#d0b4f4' : '#ffd6a5',
    cursor: editing ? 'pointer' : 'default', fontSize: '0.9em', display: 'inline-block', fontWeight: selected ? 'bold' : 'normal'
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff9e0', minHeight: '100vh' }}>
      <h1 style={{ color: '#000' }}>My Profile</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>{isOrganizer ? 'Organization Details' : 'Personal Details'}</h3>
            <button onClick={() => setEditing(!editing)} style={{ padding: '6px 14px', cursor: 'pointer', backgroundColor: '#ff6a3d', color: '#000', border: '2px solid #000', fontWeight: 'bold' }}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {message.text && <p style={msgStyle(message.type)}>{message.text}</p>}

          <form onSubmit={updateProfile}>
            {isOrganizer ? (
              <>
                <div style={{ marginBottom: '10px' }}><label>Organization Name</label><input type="text" name="name" value={profile.name || ''} onChange={handleChange} disabled={!editing} style={fieldStyle} required /></div>
                <div style={{ marginBottom: '10px' }}><label>Category</label>
                  <select name="category" value={profile.category || ''} onChange={handleChange} disabled={!editing} style={fieldStyle}>
                    <option value="">-- Select --</option>
                    <option value="Clubs">Clubs</option>
                    <option value="Councils">Councils</option>
                    <option value="Fest Teams">Fest Teams</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Technical">Technical</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: '10px' }}><label>Description</label><textarea name="desc" value={profile.desc || ''} onChange={handleChange} disabled={!editing} style={{ ...fieldStyle, minHeight: '80px' }} /></div>
                <div style={{ marginBottom: '10px' }}><label>Contact Number (optional)</label><input type="text" name="contactNumber" value={profile.contactNumber || ''} onChange={handleChange} disabled={!editing} style={fieldStyle} placeholder="e.g. 9876543210" /></div>

                {profile.organizerId && <div style={{ marginBottom: '10px' }}><label>Organizer ID</label><input type="text" value={profile.organizerId} disabled style={{ ...disabledStyle, backgroundColor: '#fdef26' }} /></div>}
              </>
            ) : (
              <>
                <div style={{ marginBottom: '10px' }}><label>First Name</label><input type="text" name="firstName" value={profile.firstName || ''} onChange={handleChange} disabled={!editing} style={fieldStyle} required /></div>
                <div style={{ marginBottom: '10px' }}><label>Last Name</label><input type="text" name="lastName" value={profile.lastName || ''} onChange={handleChange} disabled={!editing} style={fieldStyle} required /></div>
                <div style={{ marginBottom: '10px' }}><label>Contact Number</label><input type="text" name="contactNumber" value={profile.contactNumber || ''} onChange={handleChange} disabled={!editing} style={fieldStyle} /></div>
                <div style={{ marginBottom: '10px' }}><label>College / Organization</label><input type="text" name="collegeName" value={profile.collegeName || ''} onChange={handleChange} disabled={!editing || profile.participantType === 'IIIT'} style={profile.participantType === 'IIIT' ? disabledStyle : fieldStyle} /></div>
                <div style={{ marginBottom: '10px' }}><label>Participant Type</label><input type="text" value={profile.participantType || 'N/A'} disabled style={disabledStyle} /></div>
              </>
            )}
            <div style={{ marginBottom: '10px' }}><label>Email (Read Only)</label><input type="email" value={profile.email || ''} disabled style={disabledStyle} /></div>

            {!isOrganizer && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold' }}>Interests</label>
                {editing ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                    {interestsList.map(interest => {
                      const isSelected = (profile.interests || []).includes(interest);
                      return <div key={interest} onClick={() => toggleInterest(interest)} style={chipStyle(isSelected)}>{interest}</div>;
                    })}
                  </div>
                ) : <p style={{ margin: '5px 0' }}>{(profile.interests || []).join(', ') || 'None selected'}</p>}
              </div>
            )}

            {!isOrganizer && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold' }}>Followed Clubs</label>
                {editing ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                    {organizers.map(org => {
                      const isFollowed = (profile.followedClubs || []).includes(org._id);
                      return <div key={org._id} onClick={() => toggleClub(org._id)} style={chipStyle(isFollowed)}>{org.name}</div>;
                    })}
                  </div>
                ) : (
                  (!profile.followedClubs || profile.followedClubs.length === 0)
                    ? <p style={{ color: '#000' }}>Not following any clubs.</p>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                        {profile.followedClubs.map(clubId => {
                          const club = organizers.find(o => o._id === clubId);
                          return <div key={clubId} style={{ padding: '6px 12px', border: '2px solid #000', backgroundColor: '#e8ccff', fontSize: '0.9em' }}>{club ? club.name : 'Unknown'}</div>;
                        })}
                      </div>
                )}
              </div>
            )}

            {editing && <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ff6a3d', color: '#000', border: '2px solid #000', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>}
          </form>
        </div>

        <div>
          <h3>Security Settings</h3>
          {pwMsg.text && <p style={msgStyle(pwMsg.type)}>{pwMsg.text}</p>}
          {isOrganizer && <PasswordResetSection token={user.token} />}
          <div style={{ border: '2px solid #000', padding: '15px', backgroundColor: '#b3f6ff' }}>
            <h4 style={{ marginTop: 0 }}>Change Password</h4>
            <form onSubmit={updatePassword}>
              <div style={{ marginBottom: '10px' }}><label>Current Password</label><input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} style={fieldStyle} required /></div>
              <div style={{ marginBottom: '10px' }}><label>New Password</label><input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} style={fieldStyle} required /></div>
              <div style={{ marginBottom: '10px' }}><label>Confirm New Password</label><input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} style={fieldStyle} required /></div>
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#ff7676', color: '#000', border: '2px solid #000', cursor: 'pointer', fontWeight: 'bold' }}>Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [customFormData, setCustomFormData] = useState({});
  const [selectedMerchItem, setSelectedMerchItem] = useState(null);
  const [merchQuantity, setMerchQuantity] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Hackathon team states
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState(2);
  const [joinCode, setJoinCode] = useState('');
  const [myTeam, setMyTeam] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    if (user) checkRegistrationStatus();
    if (user) checkTeamStatus();
  }, [id, user]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`${API}/api/events/${id}`);
      const data = await response.json();
      if (response.ok) {
        setEvent(data);
      } else {
        setMessage({ text: 'Event not found', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      if (!user) setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch(`${API}/api/registrations/my`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
        if (response.ok) {
          let found = false;
          for (const reg of data) {
            if ((reg.event && reg.event._id === id) || reg.event === id) {
              found = true;
              break;
            }
          }
          if (found) setIsRegistered(true);
        }
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTeamStatus = async () => {
    try {
      const res = await fetch(`${API}/api/teams/my`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        let foundTeam = null;
        for (const t of data) {
          if ((t.event && t.event._id === id) || t.event === id) {
            foundTeam = t;
            break;
          }
        }
        if (foundTeam) setMyTeam(foundTeam);
      }
    } catch (err) {
      console.error('Check team error:', err);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { setMessage({ text: 'Enter a team name', type: 'error' }); return; }
    try {
      const res = await fetch(`${API}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ eventId: id, teamName: teamName.trim(), maxSize: teamSize })
      });
      const data = await res.json();
      if (res.ok) {
        setMyTeam(data);
        setMessage({ text: `Team created! Share code: ${data.teamCode}`, type: 'success' });
        setShowTeamForm(false);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error', type: 'error' });
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) { setMessage({ text: 'Enter a team code', type: 'error' }); return; }
    try {
      const res = await fetch(`${API}/api/teams/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ teamCode: joinCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setMyTeam(data);
        setMessage({ text: 'Joined team successfully!', type: 'success' });
        if (data.status === 'registered') {
          setIsRegistered(true);
          setMessage({ text: 'Team is complete! Tickets generated for all members.', type: 'success' });
        }
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error', type: 'error' });
    }
  };

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    setMessage({ text: '', type: '' });

    if (event.customForm && event.customForm.length > 0) {
      for (let field of event.customForm) {
        if (field.required && !customFormData[field.label]) {
          setMessage({ text: `Please fill in: ${field.label}`, type: 'error' });
          return;
        }
      }
    }

    if (event.type === 'Merchandise' && !selectedMerchItem) {
      setMessage({ text: 'Please select a merchandise item', type: 'error' });
      return;
    }

    if (!window.confirm('Confirm registration for this event?')) return;

    setRegistering(true);
    try {
      const body = { eventId: id, formData: customFormData };
      if (event.type === 'Merchandise' && selectedMerchItem) {
        body.merchandiseDetails = { itemId: selectedMerchItem._id, quantity: merchQuantity };
      }

      const response = await fetch(`${API}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: 'Registration successful! Redirecting to dashboard...', type: 'success' });
        setIsRegistered(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setMessage({ text: data.message || 'Registration failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Server error', type: 'error' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!event) return <div style={{ padding: '20px' }}>Event not found.</div>;

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isFull = event.registrationLimit > 0 && (event.registeredCount || 0) >= event.registrationLimit;
  const organizerName = event.organizer && event.organizer.name ? event.organizer.name : 'Unknown';
  const selectedMerchId = selectedMerchItem ? selectedMerchItem._id : null;
  const teamMembers = myTeam && myTeam.members ? myTeam.members : [];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      {user && event.organizer && user._id === event.organizer._id ? (
        <button onClick={() => navigate('/organizer/dashboard')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '8px 16px', border: '2px solid var(--black)', backgroundColor: 'var(--yellow)', fontWeight: 'bold' }}>Back to Dashboard</button>
      ) : (
        <button onClick={() => navigate('/events')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '8px 16px', border: '2px solid var(--black)', backgroundColor: 'var(--gray-light)' }}>Back to Events</button>
      )}
      
      <div style={{ border: '2px solid var(--black)', padding: '20px', backgroundColor: 'var(--white)' }}>
        <h1 style={{ marginTop: 0 }}>{event.name}</h1>
        <p style={{ margin: '5px 0' }}>Organized by: <strong>{organizerName}</strong>{event.organizer && event.organizer.organizerId && <span style={{ backgroundColor: 'var(--yellow)', padding: '1px 6px', marginLeft: '5px', border: '1px solid var(--black)' }}>ID: {event.organizer.organizerId}</span>}</p>
        
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div style={{ margin: '10px 0' }}>
            {event.tags.map((tag, i) => (
              <span key={i} style={{ display: 'inline-block', padding: '3px 10px', backgroundColor: 'var(--purple)', border: '2px solid var(--black)', marginRight: '5px', marginBottom: '5px', fontSize: '0.85em', fontWeight: 'bold' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
          <div>
            <h3>Details</h3>
            <p><strong>Type:</strong> {event.type}</p>
            <p><strong>Date:</strong> {new Date(event.startDate).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Eligibility:</strong> {event.eligibility || 'Open to All'}</p>
          </div>
          <div>
            <h3>Registration</h3>
            <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Fee:</strong> {event.fee === 0 ? 'Free' : `Rs. ${event.fee}`}</p>
            <p><strong>Status:</strong> {event.status}</p>
            {event.registrationLimit > 0 && (
              <p><strong>Spots:</strong> {(event.registeredCount || 0)} / {event.registrationLimit}
                {isFull && <span style={{ color: 'var(--black)', marginLeft: '10px', backgroundColor: 'var(--red)', padding: '1px 6px', border: '1px solid var(--black)' }}>(Full)</span>}
              </p>
            )}
          </div>
        </div>

        <h3>Description</h3>
        <p>{event.description}</p>

        {/* Merchandise Items Selection - Hidden for Organizer */}
        {event.type === 'Merchandise' && event.merchandiseItems && event.merchandiseItems.length > 0 && !isRegistered && !isDeadlinePassed && !isFull && (!user || !event.organizer || user._id !== event.organizer._id) && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--purple)', border: '2px solid var(--black)' }}>
            <h3 style={{ marginTop: 0 }}>Select Merchandise</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {event.merchandiseItems.map((item) => (
                <label key={item._id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', border: selectedMerchId === item._id ? '3px solid var(--black)' : '2px solid var(--black)', 
                  cursor: item.stock > 0 ? 'pointer' : 'not-allowed',
                  opacity: item.stock > 0 ? 1 : 0.5, backgroundColor: selectedMerchId === item._id ? 'var(--yellow)' : 'var(--white)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="radio" name="merchItem" disabled={item.stock <= 0} checked={selectedMerchId === item._id} onChange={() => setSelectedMerchItem(item)} />
                    <div>
                      <strong>{item.name}</strong>
                      {item.description && <p style={{ margin: '2px 0 0 0', fontSize: '0.85em' }}>{item.description}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>Rs. {item.price}</div>
                    <div style={{ fontSize: '0.85em', fontWeight: 'bold', backgroundColor: item.stock > 0 ? 'var(--green)' : 'var(--red)', padding: '1px 6px', border: '1px solid var(--black)' }}>
                      {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {selectedMerchItem && (
              <div style={{ marginTop: '10px' }}>
                <label>Quantity: </label>
                <input type="number" min="1" max={selectedMerchItem.stock} value={merchQuantity} onChange={(e) => setMerchQuantity(Math.min(parseInt(e.target.value) || 1, selectedMerchItem.stock))} style={{ padding: '5px', width: '80px' }} />
              </div>
            )}
          </div>
        )}

        {/* Custom Form Fields - Hidden for Organizer */}
        {event.customForm && event.customForm.length > 0 && !isRegistered && !isDeadlinePassed && !isFull && (!user || !event.organizer || user._id !== event.organizer._id) && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--white)', border: '2px solid var(--black)' }}>
            <h3 style={{ marginTop: 0 }}>Additional Information Required</h3>
            {event.customForm.map((field, index) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {field.label} {field.required && <span style={{ color: 'var(--red)' }}>*</span>}
                </label>
                {field.type === 'text' && (
                  <input type="text" value={customFormData[field.label] || ''} onChange={(e) => setCustomFormData({...customFormData, [field.label]: e.target.value})} />
                )}
                {field.type === 'file' && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                     <input type="file" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                           setMessage({ text: 'Uploading...', type: 'info' });
                           const res = await fetch(`${API}/api/upload`, {
                              method: 'POST', body: fd
                           });
                           const data = await res.json();
                           if (res.ok) {
                              setCustomFormData({...customFormData, [field.label]: `${API}${data.filePath}`});
                              setMessage({ text: 'File uploaded!', type: 'success' });
                           } else {
                              setMessage({ text: 'Upload failed', type: 'error' });
                           }
                        } catch (err) {
                           console.error(err);
                           setMessage({ text: 'Upload error', type: 'error' });
                        }
                     }} />
                     {customFormData[field.label] && <span style={{ color: 'var(--black)' }}>Uploaded</span>}
                  </div>
                )}
                {field.type === 'number' && (
                  <input type="number" value={customFormData[field.label] || ''} onChange={(e) => setCustomFormData({...customFormData, [field.label]: e.target.value})} />
                )}
                {field.type === 'dropdown' && field.options && (
                  <select value={customFormData[field.label] || ''} onChange={(e) => setCustomFormData({...customFormData, [field.label]: e.target.value})}>
                    <option value="">Select...</option>
                    {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                )}
                {field.type === 'radio' && field.options && (
                  <div>
                    {field.options.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input type="radio" name={`custom-radio-${index}`} value={opt} checked={customFormData[field.label] === opt} onChange={(e) => setCustomFormData({...customFormData, [field.label]: e.target.value})} /> {opt}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'checkbox' && field.options && field.options.length > 0 ? (
                  <div>
                    {field.options.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={(customFormData[field.label] || []).includes(opt)} onChange={(e) => {
                          const current = customFormData[field.label] || [];
                          const updated = e.target.checked ? [...current, opt] : current.filter(v => v !== opt);
                          setCustomFormData({...customFormData, [field.label]: updated});
                        }} /> {opt}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' && (!field.options || field.options.length === 0) && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={customFormData[field.label] || false} onChange={(e) => setCustomFormData({...customFormData, [field.label]: e.target.checked})} />
                    {field.label}
                  </label>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message area */}
        {message.text && (
          <p style={{ 
            marginTop: '15px', padding: '10px',
            backgroundColor: message.type === 'success' ? 'var(--green)' : 'var(--red)',
            color: 'var(--black)', fontWeight: 'bold',
            border: '2px solid var(--black)'
          }}>{message.text}</p>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {isRegistered ? (
            <button disabled style={{ padding: '10px 20px', backgroundColor: 'var(--green)', opacity: 0.8 }}>
              Already Registered
            </button>
          ) : isDeadlinePassed ? (
            <button disabled style={{ padding: '10px 20px', backgroundColor: 'var(--red)', opacity: 0.8 }}>
              Registration Closed
            </button>
          ) : isFull ? (
            <button disabled style={{ padding: '10px 20px', backgroundColor: 'var(--gray-light)', opacity: 0.8 }}>
              Event Full
            </button>
          ) : (
            <button onClick={handleRegister} disabled={registering} style={{ padding: '10px 25px', fontSize: '1.1em' }}>
              {registering ? 'Registering...' : (event.type === 'Merchandise' ? 'Purchase' : 'Register Now')}
            </button>
          )}
        </div>

        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          {isRegistered && (
            <Link to={`/feedback/${id}`} style={{ display: 'inline-block', marginLeft: '10px', padding: '8px 16px', backgroundColor: 'var(--yellow)', color: 'var(--black)', textDecoration: 'none', fontSize: '0.9em', border: '2px solid var(--black)', fontWeight: 'bold' }}>
              Give Feedback
            </Link>
          )}
        </div>

        {/* Hackathon Team Section */}
        {event.type === 'Hackathon' && user && user.role === 'participant' && (
          <div style={{ marginTop: '25px', padding: '20px', border: '2px solid var(--black)', backgroundColor: 'var(--cyan)' }}>
            <h3 style={{ marginTop: 0 }}>Hackathon Team Registration</h3>
            <p style={{ fontSize: '0.9em' }}>
              Team size: {event.minTeamSize} - {event.maxTeamSize} members
            </p>

            {myTeam ? (
              <div>
                <div style={{ padding: '15px', backgroundColor: 'var(--cyan)', border: '2px solid var(--black)', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>{myTeam.name}</h4>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Status:</strong>{' '}
                    <span style={{ fontWeight: 'bold', backgroundColor: myTeam.status === 'registered' ? 'var(--green)' : 'var(--yellow)', padding: '1px 6px', border: '1px solid var(--black)' }}>
                      {myTeam.status.toUpperCase()}
                    </span>
                  </p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Team Code:</strong>{' '}
                    <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--yellow)', padding: '2px 6px', border: '1px solid var(--black)' }}>{myTeam.teamCode}</span>
                    <button onClick={() => navigator.clipboard.writeText(myTeam.teamCode)}
                      style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '0.8em', cursor: 'pointer' }}>
                      Copy
                    </button>
                  </p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Members:</strong> {teamMembers.length} / {myTeam.maxSize}
                  </p>
                  <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                    {teamMembers.map(m => (
                      <li key={m._id}>{m.firstName} {m.lastName}</li>
                    ))}
                  </ul>
                  {myTeam.status === 'forming' && (
                    <p style={{ fontSize: '0.9em', backgroundColor: 'var(--yellow)', padding: '6px', border: '1px solid var(--black)' }}>
                      Share the team code with your teammates to complete registration.
                    </p>
                  )}
                  {myTeam.status === 'registered' && (
                    <p style={{ fontWeight: 'bold', backgroundColor: 'var(--green)', padding: '6px', border: '1px solid var(--black)' }}>
                      Team is complete! Tickets have been generated.
                    </p>
                  )}
                  <Link to={`/teams/${myTeam._id}/chat`} style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: 'var(--yellow)', color: 'var(--black)', textDecoration: 'none', border: '2px solid var(--black)', fontWeight: 'bold', marginTop: '10px' }}>Open Team Chat</Link>
                </div>
              </div>
            ) : !isDeadlinePassed && !isFull ? (
              <div>
                {/* Create Team */}
                {!showTeamForm ? (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={() => setShowTeamForm(true)}
                      style={{ padding: '10px 20px' }}>
                      Create Team
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '15px', backgroundColor: 'var(--cyan)', border: '2px solid var(--black)', marginBottom: '15px' }}>
                    <h4 style={{ marginTop: 0 }}>Create New Team</h4>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '4px' }}>Team Name:</label>
                      <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Code Warriors" />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '4px' }}>Team Size ({event.minTeamSize}-{event.maxTeamSize}):</label>
                      <input type="number" value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))}
                        min={event.minTeamSize} max={event.maxTeamSize}
                        style={{ width: '100px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleCreateTeam}>Create</button>
                      <button onClick={() => setShowTeamForm(false)}
                        style={{ backgroundColor: 'var(--gray-light)' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Join Team */}
                <div style={{ padding: '15px', backgroundColor: 'var(--cyan)', border: '2px solid var(--black)' }}>
                  <h4 style={{ marginTop: 0 }}>Join Existing Team</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Enter team code" style={{ flex: 1 }} />
                    <button onClick={handleJoinTeam}>Join</button>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ backgroundColor: 'var(--red)', padding: '8px', border: '2px solid var(--black)', fontWeight: 'bold' }}>Registration is closed for this event.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;

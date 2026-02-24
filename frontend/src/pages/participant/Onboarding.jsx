import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const Onboarding = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const interestsList = [
    'Coding', 'Arts', 'Music', 'Dance', 'Photography',
    'Reading', 'Gaming', 'Research', 'Sports',
    'AI/ML', 'Cybersec', 'Finance'
  ];

  useEffect(() => { fetchOrganizers(); }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await fetch(`${API}/api/organizers`);
      const data = await response.json();
      if (response.ok) setOrganizers(data);
    } catch (error) { console.error('Error:', error); }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const toggleClub = (orgId) => {
    setFollowedClubs(prev => prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]);
  };

  const savePreferences = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ interests: selectedInterests, followedClubs, hasCompletedOnboarding: true })
      });
      if (response.ok) {
        setMessage('Preferences saved! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else { setMessage('Failed to save. Try again.'); }
    } catch (error) { setMessage(error); }
    finally { setLoading(false); }
  };

  const chipStyle = (selected) => ({
    padding: '8px 16px',
    border: `2px solid var(--black)`,
    backgroundColor: selected ? 'var(--purple)' : 'var(--white)',
    color: 'var(--black)',
    cursor: 'pointer',
    fontSize: '0.9em',
    display: 'inline-block',
    fontWeight: selected ? 'bold' : 'normal'
  });

  return (
    <div style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto', minHeight: '100vh' }}>
      <h1 style={{ color: 'var(--black)' }}>Welcome, {user?.name || user?.firstName}!</h1>

      {message && (
        <p style={{ padding: '10px', backgroundColor: message.includes('saved') ? 'var(--green)' : 'var(--red)', color: 'var(--black)', border: '2px solid var(--black)', marginBottom: '20px' }}>
          {message}
        </p>
      )}

      {step === 1 && (
        <div>
          <h3 style={{ color: 'var(--black)' }}>Select Your Interests</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
            {interestsList.map(interest => (
              <div key={interest} onClick={() => toggleInterest(interest)} style={chipStyle(selectedInterests.includes(interest))}>
                {interest}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => { setSelectedInterests([]); setStep(2); }} style={{ padding: '10px 24px', backgroundColor: 'var(--gray-light)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontSize: '1em' }}>
              Skip
            </button>
            <button onClick={() => setStep(2)} style={{ padding: '10px 24px', backgroundColor: 'var(--yellow)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ color: 'var(--black)' }}>Follow Clubs / Organizers</h3>

          {organizers.length === 0 ? (
            <p>No clubs available yet</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
              {organizers.map(org => {
                const isFollowed = followedClubs.includes(org._id);
                return (
                  <div key={org._id} onClick={() => toggleClub(org._id)} style={{
                    padding: '10px 16px', border: `2px solid var(--black)`,
                    backgroundColor: isFollowed ? 'var(--green)' : 'var(--cyan)',
                    cursor: 'pointer', minWidth: '120px'
                  }}>
                    <strong style={{ fontSize: '0.95em' }}>{org.name}</strong>
                    <div style={{ fontSize: '0.8em', color: 'var(--black)', marginTop: '2px' }}>{org.category || ''}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setStep(1)} style={{ padding: '10px 24px', backgroundColor: 'var(--gray-light)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontSize: '1em' }}>
              Back
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={savePreferences} disabled={loading} style={{ padding: '10px 16px', backgroundColor: 'var(--gray-light)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontSize: '0.95em' }}>
                Skip
              </button>
              <button onClick={savePreferences} disabled={loading} style={{ padding: '10px 24px', backgroundColor: 'var(--yellow)', color: 'var(--black)', border: '2px solid var(--black)', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>
                {loading ? 'Saving...' : 'Finish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;

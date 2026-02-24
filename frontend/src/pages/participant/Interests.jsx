import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const Interests = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  const interestsList = ['Coding', 'Design', 'Music', 'Dance', 'Photography', 'Literature', 'Gaming', 'Research'];

  const handleCheckboxChange = (interest) => {
    if (selectedInterests.includes(interest)) setSelectedInterests(selectedInterests.filter(i => i !== interest));
    else setSelectedInterests([...selectedInterests, interest]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ interests: selectedInterests }) });
      if (r.ok) navigate('/'); else alert('Failed to save preferences');
    } catch (e) { console.error(e); alert('Server error'); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Select your areas of interest.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          {interestsList.map(interest => (
            <label key={interest} style={{
              padding: '10px', border: '2px solid var(--black)', cursor: 'pointer',
              backgroundColor: selectedInterests.includes(interest) ? 'var(--purple)' : 'var(--white)',
              fontWeight: selectedInterests.includes(interest) ? 'bold' : 'normal'
            }}>
              <input type="checkbox" value={interest} checked={selectedInterests.includes(interest)} onChange={() => handleCheckboxChange(interest)} style={{ marginRight: '5px', width: 'auto', marginBottom: 0 }} />
              {interest}
            </label>
          ))}
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save & Continue'}</button>
        <button type="button" onClick={() => navigate('/')} style={{ marginLeft: '10px', backgroundColor: 'var(--gray-light)' }}>Skip</button>
      </form>
    </div>
  );
};

export default Interests;

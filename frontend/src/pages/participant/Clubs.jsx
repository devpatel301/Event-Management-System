import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';
import API from '../../api';

const Clubs = () => {
  const { user } = useContext(AuthContext);
  const [organizers, setOrganizers] = useState([]);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrganizers(); if (user && user.role === 'participant') fetchFollowed(); }, []);

  const fetchOrganizers = async () => {
    try { const r = await fetch(`${API}/api/organizers`); const d = await r.json(); if (r.ok) setOrganizers(d); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchFollowed = async () => {
    try { const r = await fetch(`${API}/api/users/profile`, { headers: { 'Authorization': `Bearer ${user.token}` } }); const d = await r.json(); if (r.ok) setFollowedClubs(d.followedClubs || []); } catch (e) { console.error(e); }
  };

  const toggleFollow = async (orgId) => {
    if (!user) return;
    const isFollowing = followedClubs.includes(orgId);
    const updated = isFollowing ? followedClubs.filter(id => id !== orgId) : [...followedClubs, orgId];
    try { const r = await fetch(`${API}/api/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify({ followedClubs: updated }) }); if (r.ok) setFollowedClubs(updated); } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Clubs...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
      <h1>Clubs and Organizers</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {organizers.map(org => {
          const isFollowing = followedClubs.includes(org._id);
          return (
            <div key={org._id} style={{ border: '2px solid var(--black)', padding: '20px', backgroundColor: 'var(--cyan)' }}>
              <h2 style={{ marginTop: 0 }}>{org.name}</h2>
              <p style={{ fontWeight: 'bold', backgroundColor: 'var(--purple)', display: 'inline-block', padding: '2px 10px', border: '1px solid var(--black)' }}>{org.category}</p>
              <p>{org.desc}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Link to={`/clubs/${org._id}`} style={{ padding: '8px 16px', backgroundColor: 'var(--yellow)', color: 'var(--black)', textDecoration: 'none', border: '2px solid var(--black)', fontWeight: 'bold' }}>View Details</Link>
                {user && user.role === 'participant' && (
                  <button onClick={() => toggleFollow(org._id)} style={{
                    padding: '8px 16px', backgroundColor: isFollowing ? 'var(--red)' : 'var(--green)',
                    border: '2px solid var(--black)', cursor: 'pointer'
                  }}>{isFollowing ? 'Unfollow' : 'Follow'}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Clubs;

import { useState, useEffect, useContext } from 'react';
import EventCard from '../components/EventCard';
import AuthContext from '../context/AuthContext';
import API from '../api';

const BrowseEvents = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterEligibility, setFilterEligibility] = useState('All');
  const [filterFollowed, setFilterFollowed] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [followedClubs, setFollowedClubs] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);

  useEffect(() => { if (!authLoading) fetchAll(); }, [authLoading]);
  useEffect(() => { applyFilters(); }, [searchTerm, filterType, filterEligibility, filterFollowed, filterAvailable, startDate, endDate, allEvents, userInterests, followedClubs]);

  const fetchAll = async () => {
    try {
      const requests = [
        fetch(`${API}/api/events`),
        fetch(`${API}/api/events/trending`),
      ];
      if (user) requests.push(fetch(`${API}/api/users/profile`, { headers: { 'Authorization': `Bearer ${user.token}` } }));

      const responses = await Promise.all(requests);
      const [eventsData, trendingData, profileData] = await Promise.all(responses.map(r => r.json()));

      if (responses[0].ok) setAllEvents(eventsData);
      if (responses[1].ok) setTrendingEvents(trendingData);
      if (profileData && responses[2]?.ok) {
        setFollowedClubs((profileData.followedClubs || []).map(id => id.toString()));
        setUserInterests(profileData.interests || []);
      }
    } catch (e) { console.log('Fetch error', e); }
    setLoading(false);
  };

  // Score events by how well they match user interests and followed clubs
  const getRelevanceScore = (event) => {
    let score = 0;
    const tags = (event.tags || []).map(t => t.toLowerCase());
    for (const interest of userInterests) {
      if (tags.includes(interest.toLowerCase())) score += 2;
      if (event.name && event.name.toLowerCase().includes(interest.toLowerCase())) score += 1;
      if (event.description && event.description.toLowerCase().includes(interest.toLowerCase())) score += 1;
    }
    if (event.organizer && followedClubs.includes(event.organizer._id.toString())) score += 3;
    return score;
  };

  const applyFilters = () => {
    var filtered = [...allEvents];

    if (searchTerm) {
      const lt = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(lt) ||
        (e.description && e.description.toLowerCase().includes(lt)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(lt))) ||
        (e.organizer && e.organizer.name && e.organizer.name.toLowerCase().includes(lt))
      );
    }

    if (filterType !== 'All') filtered = filtered.filter(e => e.type === filterType);
    if (filterEligibility !== 'All') filtered = filtered.filter(e => e.eligibility === filterEligibility);
    if (filterFollowed && user) filtered = filtered.filter(e => e.organizer && followedClubs.includes(e.organizer._id.toString()));

    if (startDate) filtered = filtered.filter(e => new Date(e.startDate) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(e => new Date(e.startDate) <= new Date(endDate));

    if (filterAvailable) {
      const now = new Date();
      filtered = filtered.filter(e => {
        if (new Date(e.registrationDeadline) <= now) return false;
        if (e.registrationLimit > 0 && (e.registeredCount || 0) >= e.registrationLimit) return false;
        return true;
      });
    }

    // Always sort by relevance for logged-in users who have interests or followed clubs
    if (user && (userInterests.length > 0 || followedClubs.length > 0)) {
      filtered.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));
    }

    setEvents(filtered);
  };

  // const hasPreferences = user && (userInterests.length > 0 || followedClubs.length > 0);

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      <h1>Browse Events</h1>

      {/* Trending */}
      {trendingEvents.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Trending Now
          </h2>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {trendingEvents.map((event) => (
              <div key={event._id} style={{ minWidth: '220px', maxWidth: '220px', border: '2px solid var(--black)', backgroundColor: 'var(--white)', padding: '12px', flexShrink: 0, position: 'relative' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '0.95rem', paddingRight: '28px' }}>{event.name}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--gray)' }}>{event.organizer?.name}</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--gray)' }}>{event.registeredCount || 0} registered</p>
                <a href={`/events/${event._id}`} style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--black)', textDecoration: 'underline' }}>View</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 'auto' }}>
          <option value="All">All Types</option>
          <option value="Normal">Normal</option>
          <option value="Merchandise">Merchandise</option>
          <option value="Hackathon">Hackathon</option>
        </select>
        <select value={filterEligibility} onChange={(e) => setFilterEligibility(e.target.value)} style={{ width: 'auto' }}>
          <option value="All">All Eligibility</option>
          <option value="IIIT Students">IIIT Students</option>
          <option value="All">All</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 'auto' }} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 'auto' }} />
        {user && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
            <input type="checkbox" checked={filterFollowed} onChange={(e) => setFilterFollowed(e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
            Followed Clubs Only
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          <input type="checkbox" checked={filterAvailable} onChange={(e) => setFilterAvailable(e.target.checked)} style={{ width: 'auto', marginBottom: 0 }} />
          Available to Register
        </label>
      </div>

      {loading ? <p>Loading events...</p> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start' }}>
          {events.length > 0 ? events.map(event => <EventCard key={event._id} event={event} />) : <p>No events found.</p>}
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;

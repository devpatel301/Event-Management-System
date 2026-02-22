import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  return (
    <div style={{
      border: '2px solid #000',
      padding: '15px',
      width: '280px',
      textAlign: 'left',
      backgroundColor: '#ffd6a5',
      color: '#000',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <h3 style={{ margin: '0 0 5px 0' }}>{event.name}</h3>
      <p style={{ margin: 0, fontSize: '0.9em' }}>
        <strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}
      </p>
      <p style={{ margin: 0, fontSize: '0.9em' }}>
        <strong>Type:</strong> {event.type}
        {event.organizer && event.organizer.name && <> | <strong>By:</strong> {event.organizer.name}</>}
      </p>
      <p style={{ margin: '5px 0', fontSize: '0.9em' }}>{event.description.substring(0, 100)}...</p>
      <div style={{ marginTop: 'auto' }}>
        <Link to={`/events/${event._id}`} style={{
          display: 'inline-block',
          padding: '7px 14px',
          backgroundColor: '#ff6a3d',
          color: '#000',
          textDecoration: 'none',
          fontSize: '0.9em',
          fontWeight: 'bold',
          border: '2px solid #000'
        }}>
          View Details
        </Link>
      </div>
    </div>
  );
};

export default EventCard;

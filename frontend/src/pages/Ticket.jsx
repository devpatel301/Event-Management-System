import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import API from '../api';

const Ticket = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`${API}/api/registrations/${id}/ticket`, {
           headers: {
            'Authorization': `Bearer ${user.token}`
           }
        });
        const data = await response.json();
        if (response.ok) {
          setTicket(data);
        } else {
          setError('Failed to load ticket');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Server error loading ticket');
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchTicket();
  }, [id, user]);

  if (loading) return <div style={{ padding: '20px' }}>Loading Ticket...</div>;
  if (error) return <div style={{ padding: '20px', backgroundColor: 'var(--red)', border: '2px solid var(--black)' }}>{error}</div>;
  if (!ticket) return <div style={{ padding: '20px' }}>Ticket not found</div>;

  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '80vh' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px' }}>Back to Dashboard</button>
      
      <div style={{ 
        maxWidth: '400px', 
        margin: '0 auto', 
        backgroundColor: 'var(--gray-light)', 
        padding: '30px', 
        border: '2px solid var(--black)',
        borderTop: '6px solid var(--yellow)'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>{ticket.event.name}</h2>
        <p style={{ fontSize: '0.9em' }}>{new Date(ticket.event.startDate).toLocaleString()}</p>
        
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '2px dashed var(--black)' }} />
        
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <p><strong>Attendee:</strong> {ticket.user.firstName} {ticket.user.lastName}</p>
          <p><strong>Email:</strong> {ticket.user.email}</p>
          <p><strong>Ticket ID:</strong> <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--yellow)', padding: '2px 5px', border: '1px solid var(--black)' }}>{ticket.ticketId}</span></p>
          <p><strong>Registration Date:</strong> {new Date(ticket.registrationDate || ticket.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> <span style={{ fontWeight: 'bold', backgroundColor: 'var(--green)', padding: '2px 8px', border: '1px solid var(--black)' }}>{ticket.status}</span></p>
          
          {ticket.team && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--cyan)', border: '2px solid var(--black)' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Team: {ticket.team.name}</p>
              <p style={{ margin: 0, fontSize: '0.9em' }}>Team Code: <span style={{ fontFamily: 'monospace' }}>{ticket.team.teamCode}</span></p>
            </div>
          )}

          {ticket.merchandiseDetails && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--purple)', border: '2px solid var(--black)' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Merchandise Details:</p>
              {ticket.merchandiseDetails.size && <p>Size: {ticket.merchandiseDetails.size}</p>}
              {ticket.merchandiseDetails.color && <p>Color: {ticket.merchandiseDetails.color}</p>}
              {ticket.merchandiseDetails.variant && <p>Variant: {ticket.merchandiseDetails.variant}</p>}
              <p>Quantity: {ticket.merchandiseDetails.quantity || 1}</p>
            </div>
          )}
        </div>

        <div style={{ margin: '20px 0' }}>
            {/* Generate QR Code with comprehensive ticket data */}
            <QRCodeCanvas 
              value={JSON.stringify({
                ticketId: ticket.ticketId,
                eventName: ticket.event.name,
                eventDate: ticket.event.startDate,
                attendeeName: `${ticket.user.firstName} ${ticket.user.lastName}`,
                attendeeEmail: ticket.user.email,
                status: ticket.status,
                registrationDate: ticket.registrationDate
              })} 
              size={180} 
              level="M"
            />
        </div>
        
        <p style={{ fontSize: '0.8em' }}>Scan this QR code at the venue entry</p>
      </div>
    </div>
  );
};

export default Ticket;

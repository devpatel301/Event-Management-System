import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../shared/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    collegeName: ''
  });
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
  const isIIITEmail = iiitDomains.some(d => formData.email.endsWith(d));

  const handleChange = (e) => {
    let updated = { ...formData, [e.target.name]: e.target.value };
    if (e.target.name === 'email') {
      if (iiitDomains.some(d => e.target.value.endsWith(d))) {
        updated.collegeName = 'IIIT Hyderabad';
      }
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.contactNumber.trim()) { setError('Contact number is required.'); return; }
    if (!isIIITEmail && !formData.collegeName.trim()) { setError('College/Organization name is required.'); return; }

    const participantType = isIIITEmail ? 'IIIT' : 'Non-IIIT';
    try {
      const payload = {
        firstName: formData.firstName, lastName: formData.lastName,
        email: formData.email, password: formData.password,
        contactNumber: formData.contactNumber,
        collegeName: isIIITEmail ? 'IIIT Hyderabad' : formData.collegeName,
        role: 'participant', participantType
      };
      const result = await register(payload);
      if (result.success) {
        setSuccessMsg('Registration successful! Please login.');
        setTimeout(() => navigate('/login'), 2000);
      } else { setError(result.error); }
    } catch (err) { setError('Failed to connect to the server.'); }
  };

  const inputStyle = { padding: '12px', border: '2px solid var(--black)', fontSize: '1.1rem', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--black)' }}>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '420px', margin: '0 auto', gap: '15px' }}>
        
        {error && <p style={{ color: 'var(--black)', fontSize: '1rem', margin: 0, padding: '10px', backgroundColor: 'var(--red)', border: '2px solid var(--black)' }}>{error}</p>}
        {successMsg && <p style={{ color: 'var(--black)', fontSize: '1rem', margin: 0, padding: '10px', backgroundColor: 'var(--green)', border: '2px solid var(--black)' }}>{successMsg}</p>}

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>First Name</label>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Last Name</label>
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
          {isIIITEmail && <p style={{ margin: '5px 0 0 0', color: 'var(--black)', fontSize: '0.9em', backgroundColor: 'var(--green)', padding: '4px 8px', border: '1px solid var(--black)' }}>IIIT email detected — you are registered as an IIIT participant.</p>}
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Contact Number *</label>
          <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required style={inputStyle} placeholder="e.g. 9876543210" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>College / Organization *</label>
          {isIIITEmail ? (
            <input type="text" value="IIIT Hyderabad" disabled style={{ ...inputStyle, backgroundColor: 'var(--gray-light)' }} />
          ) : (
            <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} required style={inputStyle} placeholder="Enter your college name" />
          )}
        </div>

        <div style={{ padding: '10px', backgroundColor: 'var(--gray-light)', border: '2px solid var(--black)' }}>
          <strong>Participant Type: </strong>
          <span style={{ color: 'var(--black)', backgroundColor: isIIITEmail ? 'var(--green)' : 'var(--yellow)', padding: '2px 8px', fontWeight: 'bold' }}>{isIIITEmail ? 'IIIT' : 'Non-IIIT'}</span>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: 'var(--black)' }}>Determined automatically by your email domain.</p>
        </div>

        <button type="submit" style={{ padding: '12px', fontSize: '1.2rem' }}>
          Register
        </button>
        <p style={{ textAlign: 'center', margin: 0 }}>
          Already have an account? <a href="/login" style={{ color: 'var(--black)', fontWeight: 'bold' }}>Login here</a>
        </p>
      </form>
    </div>
  );
};

export default Register;

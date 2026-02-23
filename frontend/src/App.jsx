import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import BrowseEvents from './pages/BrowseEvents';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import EventDetails from './pages/EventDetails';
import Ticket from './pages/Ticket';
import Dashboard from './pages/Dashboard'; 
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail'; 
import OrgDashboard from './pages/OrgDashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import OrgEventDetail from './pages/OrgEventDetail'; 
import OrgFeedback from './pages/OrgFeedback';
import AdminDashboard from './pages/AdminDashboard';
import ManageOrganizers from './pages/ManageOrganizers';
import PasswordResetRequests from './pages/PasswordResetRequests'; 
import TeamDashboard from './pages/TeamDashboard';
import TeamChat from './pages/TeamChat';
import QRScanner from './pages/QRScanner';
import EventFeedback from './pages/EventFeedback';

const Home = () => (
  <div style={{ padding: '20px' }}>
    <h1>Welcome to Felicity Event Management</h1>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Participant Routes */}
        <Route path="/onboarding" element={<ProtectedRoute allowedRoles={['participant']}><Onboarding /></ProtectedRoute>} />
        <Route path="/events" element={<BrowseEvents />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/ticket/:id" element={<ProtectedRoute allowedRoles={['participant']}><Ticket /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['participant']}><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['participant', 'organizer']}><Profile /></ProtectedRoute>} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:id" element={<ClubDetail />} />
        <Route path="/teams" element={<ProtectedRoute allowedRoles={['participant']}><TeamDashboard /></ProtectedRoute>} />
        <Route path="/teams/:teamId/chat" element={<ProtectedRoute allowedRoles={['participant']}><TeamChat /></ProtectedRoute>} />
        <Route path="/feedback/:eventId" element={<EventFeedback />} />

        {/* Organizer Routes */}
        <Route path="/organizer/dashboard" element={<ProtectedRoute allowedRoles={['organizer']}><OrgDashboard /></ProtectedRoute>} />
        <Route path="/organizer/events/create" element={<ProtectedRoute allowedRoles={['organizer']}><CreateEvent /></ProtectedRoute>} />
        <Route path="/organizer/events/:id/edit" element={<ProtectedRoute allowedRoles={['organizer']}><EditEvent /></ProtectedRoute>} />
        <Route path="/organizer/events/:id" element={<ProtectedRoute allowedRoles={['organizer']}><OrgEventDetail /></ProtectedRoute>} />
        <Route path="/organizer/events/:eventId/scanner" element={<ProtectedRoute allowedRoles={['organizer']}><QRScanner /></ProtectedRoute>} />
        <Route path="/organizer/feedback" element={<ProtectedRoute allowedRoles={['organizer']}><OrgFeedback /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/organizers" element={<ProtectedRoute allowedRoles={['admin']}><ManageOrganizers /></ProtectedRoute>} />
        <Route path="/admin/password-reset" element={<ProtectedRoute allowedRoles={['admin']}><PasswordResetRequests /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

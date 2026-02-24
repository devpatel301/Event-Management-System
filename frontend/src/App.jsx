import { Routes, Route } from 'react-router-dom';
// Essential
import Login from './pages/essential/Login';
import Register from './pages/essential/Register';
// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';
// Organizer
import OrgDashboard from './pages/organizer/OrgDashboard';
import OrgEventDetail from './pages/organizer/OrgEventDetail';
import OrgFeedback from './pages/organizer/OrgFeedback';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import QRScanner from './pages/organizer/QRScanner';
// Participant
import Onboarding from './pages/participant/Onboarding';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import Ticket from './pages/participant/Ticket';
import Dashboard from './pages/participant/Dashboard';
import Profile from './pages/participant/Profile';
import TeamDashboard from './pages/participant/TeamDashboard';
import TeamChat from './pages/participant/TeamChat';
// Misc
import Clubs from './pages/participant/Clubs';
import ClubDetail from './pages/participant/ClubDetail';
import EventFeedback from './pages/participant/EventFeedback';
// Shared components / context
import Navbar from './pages/shared/Navbar';
import ProtectedRoute from './pages/shared/ProtectedRoute';
import { AuthProvider } from './pages/shared/AuthContext';

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

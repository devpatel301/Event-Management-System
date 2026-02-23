import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import API from '../api';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ users: 0, organizers: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${user.token}` } });
        const d = await r.json();
        if (r.ok) setStats(d);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchStats();
  }, [user.token]);

  if (loading) return <div style={{ padding: '20px' }}>Loading Admin Dashboard...</div>;

  const statLabels = ['Users', 'Organizers', 'Events'];
  const statValues = [stats.users, stats.organizers, stats.events];

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", textAlign: 'left' }}>
      <h1>Admin Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
        {statLabels.map((label, i) => (
          <div key={label} style={{ padding: "20px", backgroundColor: '#b3f6ff', border: "2px solid #000", textAlign: "center" }}>
            <h3>{label}</h3>
            <p style={{ fontSize: "2.5em", margin: 0, fontWeight: 'bold' }}>{statValues[i]}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        <Link to="/admin/organizers" style={{
          display: "block", padding: "20px", backgroundColor: "#f3e8ff",
          border: "2px solid #000", textDecoration: "none", color: "#000",
          fontWeight: "bold", textAlign: "center", fontSize: '1.1em'
        }}>
          Manage Organizers &rarr;
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
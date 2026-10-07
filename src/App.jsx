import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Buses from './pages/Buses.jsx';
import RoutesPage from './pages/RoutesPage.jsx';
import Schedules from './pages/Schedules.jsx';
import Notifications from './pages/Notifications.jsx';
import Drivers from './pages/Drivers.jsx';
import Students from './pages/Students.jsx';
import Profile from './pages/Profile.jsx';
import LiveTracking from './pages/LiveTracking.jsx';

function Protected({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading…</div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/buses" element={<Protected><Buses /></Protected>} />
      <Route path="/tracking" element={<Protected><LiveTracking /></Protected>} />
      <Route path="/routes" element={<Protected><RoutesPage /></Protected>} />
      <Route path="/schedules" element={<Protected><Schedules /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/drivers" element={<Protected adminOnly><Drivers /></Protected>} />
      <Route path="/students" element={<Protected adminOnly><Students /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

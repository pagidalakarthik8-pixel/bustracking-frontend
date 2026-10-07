import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    ['/dashboard', 'Dashboard'],
    ['/buses', 'Buses'],
    ['/tracking', 'Live tracking'],
    ['/routes', 'Routes'],
    ['/schedules', 'Schedules'],
    ['/notifications', 'Notifications'],
    ...(isAdmin
      ? [
          ['/drivers', 'Drivers'],
          ['/students', 'Students'],
        ]
      : [['/profile', 'My profile']]),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">🚌</span> Anurag University Bus Tracking
        </div>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <strong>{user.name}</strong>
            <span>{isAdmin ? 'Administrator' : 'Student'}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

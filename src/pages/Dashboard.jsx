import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';
import { fmtDateTime, fmtTime, STATUS_LABELS } from '../utils.js';

function NotificationList({ items }) {
  if (!items?.length) return <Empty>No notifications yet.</Empty>;
  return (
    <ul className="notif-list">
      {items.map((n) => (
        <li key={n.id}>
          <div className="notif-title">
            {n.title}
            {n.bus && <span className="chip">{n.bus.busNumber}</span>}
          </div>
          <div>{n.message}</div>
          <div className="muted small">{fmtDateTime(n.createdAt)}</div>
        </li>
      ))}
    </ul>
  );
}

function StatusSummary({ counts }) {
  return (
    <div className="stat-row">
      {Object.keys(STATUS_LABELS).map((s) => (
        <div key={s} className="stat">
          <div className="stat-num">{counts?.[s] ?? 0}</div>
          <StatusBadge status={s} />
        </div>
      ))}
    </div>
  );
}

function StudentDashboard({ data, user }) {
  const bus = data.bus;
  const todays = (data.schedules || []).filter((s) => s.days.split(',').includes(data.today));
  return (
    <div className="dashboard-page">
      <PageHeader title={`Hello, ${user.name.split(' ')[0]} 👋`} subtitle="Here is your transport summary for today." />
      <div className="grid-main">
        <section className="card">
          <h2>My bus</h2>
          {!bus ? (
            <Empty>
              You have not selected a bus yet. <Link to="/profile">Choose your bus</Link>.
            </Empty>
          ) : (
            <>
              <div className="bus-hero">
                <div className="bus-number">{bus.busNumber}</div>
                <StatusBadge status={bus.status} />
              </div>
              {bus.statusNote && <div className="alert alert-warn">{bus.statusNote}</div>}
              <dl className="kv">
                <dt>Route</dt>
                <dd>{bus.route ? bus.route.name : 'Not assigned yet'}</dd>
                <dt>Boarding stop</dt>
                <dd>{data.boardingStop || 'Not set'}</dd>
                <dt>Driver</dt>
                <dd>{bus.driver ? `${bus.driver.name} · ${bus.driver.phone}` : 'Not assigned yet'}</dd>
                <dt>Registration</dt>
                <dd>{bus.registrationNumber}</dd>
              </dl>
            </>
          )}
        </section>

        <section className="card">
          <h2>Today's trips ({data.today})</h2>
          {todays.length === 0 ? (
            <Empty>No trips scheduled for today.</Empty>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Trip</th><th>Departs</th><th>Arrives</th></tr>
              </thead>
              <tbody>
                {todays.map((s) => (
                  <tr key={s.id}>
                    <td>{s.trip === 'MORNING' ? 'Morning (to college)' : 'Evening (to home)'}</td>
                    <td>{fmtTime(s.departureTime)}</td>
                    <td>{fmtTime(s.arrivalTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid-main">
        <section className="card">
          <h2>Latest notifications</h2>
          <NotificationList items={data.notifications} />
          <Link to="/notifications" className="link-more">All notifications →</Link>
        </section>
        <section className="card">
          <h2>All buses right now</h2>
          <StatusSummary counts={data.statusCounts} />
          <Link to="/buses" className="link-more">Browse buses →</Link>
        </section>
      </div>
    </div>
  );
}

function AdminDashboard({ data }) {
  const t = data.totals || {};
  return (
    <div className="dashboard-page">
      <PageHeader title="Admin dashboard" subtitle="Overview of the college transportation service." />
      <div className="stat-row stat-row-lg">
        {[['Buses', t.buses, '/buses'], ['Drivers', t.drivers, '/drivers'], ['Routes', t.routes, '/routes'],
          ['Schedules', t.schedules, '/schedules'], ['Students', t.students, '/students']].map(([label, n, to]) => (
          <Link to={to} key={label} className="stat stat-link">
            <div className="stat-num">{n ?? 0}</div>
            <div className="muted">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid-main">
        <section className="card">
          <h2>Fleet status</h2>
          <StatusSummary counts={data.statusCounts} />
          <table className="table">
            <thead>
              <tr><th>Bus</th><th>Route</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(data.buses || []).map((b) => (
                <tr key={b.id}>
                  <td>{b.busNumber}</td>
                  <td>{b.route ? b.route.name : '—'}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/buses" className="link-more">Manage buses →</Link>
        </section>
        <section className="card">
          <h2>Recent notifications</h2>
          <NotificationList items={data.notifications} />
          <Link to="/notifications" className="link-more">Send a notification →</Link>
        </section>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;
  return isAdmin ? <AdminDashboard data={data} /> : <StudentDashboard data={data} user={user} />;
}

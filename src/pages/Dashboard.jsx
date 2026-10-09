import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';
import { fmtDateTime, fmtTime, STATUS_LABELS } from '../utils.js';

const mapUrl = (lat, lon) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;

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

function StudentDashboard({ data, user }) {
  const bus = data.bus;
  const todays = (data.schedules || []).filter((s) => s.days.split(',').includes(data.today));
  const counts = data.statusCounts || {};

  return (
    <div className="dashboard-page">
      {/* Student Top Campus Banner */}
      <div className="au-banner">
        <div className="au-banner-info">
          <div className="au-badge-strip">
            <span className="au-tag">
              <span className="pulse-dot"></span> Student Transit Portal
            </span>
            <span className="au-tag">Anurag University</span>
          </div>
          <h1>Welcome, {user.name.split(' ')[0]} 👋</h1>
          <p>Venkatapur (V), Ghatkesar · Track your assigned bus and campus transit timings.</p>
        </div>
        <div className="au-banner-actions">
          <Link to="/tracking" className="btn-glass btn-glow">Live GPS Map 📍</Link>
          <Link to="/routes" className="btn-glass">All 30 Routes 🗺️</Link>
        </div>
      </div>

      {/* Digital Campus Bus Pass Card */}
      {bus ? (
        <div className="student-pass-card">
          <div className="pass-header">
            <span className="pass-inst-title">🎓 Anurag University · Official Bus Transit Pass</span>
            <StatusBadge status={bus.status} />
          </div>
          <div className="pass-main">
            <div>
              <div className="pass-bus-big">{bus.busNumber}</div>
              <div className="pass-route-name">{bus.route ? bus.route.name : 'Route assigned'}</div>
            </div>
            {bus.statusNote && (
              <div className="alert alert-warn" style={{ maxWidth: '340px', margin: 0 }}>
                {bus.statusNote}
              </div>
            )}
          </div>
          <div className="pass-details">
            <div className="pass-field">
              <span>Your Boarding Stop</span>
              <strong>{data.boardingStop || 'Habsiguda'}</strong>
            </div>
            <div className="pass-field">
              <span>Driver</span>
              <strong>{bus.driver ? bus.driver.name : 'Assigned Driver'}</strong>
            </div>
            <div className="pass-field">
              <span>Driver Contact</span>
              <strong>{bus.driver?.phone ? <a href={`tel:${bus.driver.phone}`} style={{ color: '#fff' }}>{bus.driver.phone}</a> : '—'}</strong>
            </div>
            <div className="pass-field">
              <span>Bus Registration</span>
              <strong>{bus.registrationNumber}</strong>
            </div>
            <div className="pass-field">
              <span>Bus Capacity</span>
              <strong>{bus.capacity} Seats</strong>
            </div>
            {Number.isFinite(bus.latitude) && Number.isFinite(bus.longitude) && (
              <div className="pass-field">
                <span>GPS Location</span>
                <strong>
                  <a href={mapUrl(bus.latitude, bus.longitude)} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>
                    View Live Coordinates ↗
                  </a>
                </strong>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <h2>No bus assigned to your profile yet</h2>
          <p className="muted">Choose your bus and preferred boarding stop to receive live arrival alerts.</p>
          <Link to="/profile" className="btn btn-primary" style={{ marginTop: '10px' }}>Select Your Bus Now</Link>
        </div>
      )}

      {/* Trip Schedule & Announcements */}
      <div className="grid-main">
        <section className="card">
          <h2>Today's Trips ({data.today})</h2>
          {todays.length === 0 ? (
            <Empty>No trips scheduled for today.</Empty>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Trip Type</th>
                  <th>Departure</th>
                  <th>Arrival at Campus</th>
                </tr>
              </thead>
              <tbody>
                {todays.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.trip === 'MORNING' ? '🌅 Morning (To Anurag Univ)' : '🌆 Evening (To Home)'}</strong>
                    </td>
                    <td>{fmtTime(s.departureTime)}</td>
                    <td>{fmtTime(s.arrivalTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2>Campus Fleet Overview</h2>
          <div className="health-pills" style={{ marginBottom: '14px' }}>
            <span className="health-pill"><span className="pill-dot dot-ontime"></span> On Time: {counts.ON_TIME ?? 0}</span>
            <span className="health-pill"><span className="pill-dot dot-delayed"></span> Delayed: {counts.DELAYED ?? 0}</span>
            <span className="health-pill"><span className="pill-dot dot-stopped"></span> Not Running: {counts.NOT_RUNNING ?? 0}</span>
          </div>
          <Link to="/buses" className="btn btn-block btn-primary" style={{ textAlign: 'center' }}>
            View Full 30-Bus Fleet Matrix →
          </Link>
        </section>
      </div>

      <div className="grid-main">
        <section className="card">
          <h2>Transit Notifications & Alerts</h2>
          <NotificationList items={data.notifications} />
          <Link to="/notifications" className="link-more">All campus announcements →</Link>
        </section>
      </div>
    </div>
  );
}

function AdminDashboard({ data }) {
  const t = data.totals || {};
  const fleet = useMemo(() => data.buses || [], [data.buses]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const counts = data.statusCounts || {};
  const onTimeCount = counts.ON_TIME ?? 0;
  const delayedCount = counts.DELAYED ?? 0;
  const notRunningCount = counts.NOT_RUNNING ?? 0;
  const totalBuses = fleet.length || t.buses || 30;

  const gpsActive = useMemo(
    () => fleet.filter((b) => Number.isFinite(b.latitude) && Number.isFinite(b.longitude)),
    [fleet]
  );

  const reliabilityRate = totalBuses > 0 ? Math.round((onTimeCount / totalBuses) * 100) : 100;
  const onTimePct = totalBuses > 0 ? (onTimeCount / totalBuses) * 100 : 0;
  const delayedPct = totalBuses > 0 ? (delayedCount / totalBuses) * 100 : 0;
  const stoppedPct = totalBuses > 0 ? (notRunningCount / totalBuses) * 100 : 0;

  const filteredFleet = useMemo(() => {
    return fleet.filter((b) => {
      // Filter tab
      if (filter === 'ON_TIME' && b.status !== 'ON_TIME') return false;
      if (filter === 'DELAYED' && b.status !== 'DELAYED') return false;
      if (filter === 'GPS' && (!Number.isFinite(b.latitude) || !Number.isFinite(b.longitude))) return false;

      // Search term
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const num = (b.busNumber || '').toLowerCase();
      const route = (b.route?.name || '').toLowerCase();
      const start = (b.route?.startPoint || '').toLowerCase();
      const driver = (b.driver?.name || '').toLowerCase();
      const reg = (b.registrationNumber || '').toLowerCase();
      return num.includes(q) || route.includes(q) || start.includes(q) || driver.includes(q) || reg.includes(q);
    });
  }, [fleet, filter, search]);

  return (
    <div className="dashboard-page">
      {/* 1. Anurag University Command Banner */}
      <div className="au-banner">
        <div className="au-banner-info">
          <div className="au-badge-strip">
            <span className="au-tag">
              <span className="pulse-dot"></span> LIVE FLEET COMMAND
            </span>
            <span className="au-tag">🎓 ANURAG UNIVERSITY · VENKATAPUR, GHATKESAR</span>
            <span className="au-tag">HYDERABAD - 500068</span>
          </div>
          <h1>Campus Transport Command Center</h1>
          <p>
            Real-time GPS telemetry, route monitoring, and driver coordination across all 30 Anurag University bus routes.
          </p>
        </div>
        <div className="au-banner-actions">
          <Link to="/tracking" className="btn-glass btn-glow">Live GPS Map 📍</Link>
          <Link to="/buses" className="btn-glass">Manage Fleet 🚌</Link>
          <Link to="/notifications" className="btn-glass">Broadcast Alert 📢</Link>
        </div>
      </div>

      {/* 2. Vibrant Colourful Stat Grid */}
      <div className="colour-stat-grid">
        <Link to="/buses" className="c-stat-card stat-emerald">
          <div className="c-stat-top">
            <span>Total Fleet</span>
            <span className="c-stat-icon">🚌</span>
          </div>
          <div>
            <div className="c-stat-num">{totalBuses}</div>
            <div className="c-stat-sub">30 Campus Buses Active</div>
          </div>
        </Link>

        <Link to="/buses" className="c-stat-card stat-teal">
          <div className="c-stat-top">
            <span>On-Time Fleet</span>
            <span className="c-stat-icon">🟢</span>
          </div>
          <div>
            <div className="c-stat-num">{onTimeCount}</div>
            <div className="c-stat-sub">{reliabilityRate}% Punctuality Rate</div>
          </div>
        </Link>

        <Link to="/buses" className="c-stat-card stat-amber">
          <div className="c-stat-top">
            <span>Attention Needed</span>
            <span className="c-stat-icon">⚠️</span>
          </div>
          <div>
            <div className="c-stat-num">{delayedCount}</div>
            <div className="c-stat-sub">Delayed in Traffic</div>
          </div>
        </Link>

        <Link to="/routes" className="c-stat-card stat-indigo">
          <div className="c-stat-top">
            <span>Active Routes</span>
            <span className="c-stat-icon">🗺️</span>
          </div>
          <div>
            <div className="c-stat-num">{t.routes ?? 30}</div>
            <div className="c-stat-sub">Across Hyderabad & RR</div>
          </div>
        </Link>

        <Link to="/tracking" className="c-stat-card stat-cyan">
          <div className="c-stat-top">
            <span>GPS Telemetry</span>
            <span className="c-stat-icon">📡</span>
          </div>
          <div>
            <div className="c-stat-num">{gpsActive.length}</div>
            <div className="c-stat-sub">{gpsActive.length}/{totalBuses} Live Online</div>
          </div>
        </Link>

        <Link to="/drivers" className="c-stat-card stat-rose">
          <div className="c-stat-top">
            <span>Drivers & Staff</span>
            <span className="c-stat-icon">👨‍✈️</span>
          </div>
          <div>
            <div className="c-stat-num">{t.drivers ?? 30}</div>
            <div className="c-stat-sub">Assigned Licensed Drivers</div>
          </div>
        </Link>
      </div>

      {/* 3. Fleet Health & Service Progress */}
      <div className="fleet-health-card">
        <div className="health-header">
          <h2>
            <span>📊</span> Fleet Reliability & Operations Breakdown
          </h2>
          <span className="health-badge">
            {reliabilityRate}% Service Health
          </span>
        </div>
        <div className="progress-stacked">
          <div className="seg-ontime" style={{ width: `${onTimePct}%` }} title={`On Time: ${onTimeCount}`} />
          <div className="seg-delayed" style={{ width: `${delayedPct}%` }} title={`Delayed: ${delayedCount}`} />
          <div className="seg-stopped" style={{ width: `${stoppedPct}%` }} title={`Not Running: ${notRunningCount}`} />
        </div>
        <div className="health-pills">
          <span className="health-pill">
            <span className="pill-dot dot-ontime"></span> On Time: <strong>{onTimeCount}</strong>
          </span>
          <span className="health-pill">
            <span className="pill-dot dot-delayed"></span> Delayed: <strong>{delayedCount}</strong>
          </span>
          {notRunningCount > 0 && (
            <span className="health-pill">
              <span className="pill-dot dot-stopped"></span> Not Running: <strong>{notRunningCount}</strong>
            </span>
          )}
          <span className="health-pill" style={{ marginLeft: 'auto' }}>
            GPS Status: <strong>{gpsActive.length} / {totalBuses} Online (100%)</strong>
          </span>
        </div>
      </div>

      {/* 4. Anurag University 4 Major Transit Corridors */}
      <div className="corridors-section">
        <div className="corridors-header">
          <h2>🌐 Anurag University Transit Corridors (30 Routes)</h2>
          <p>
            Buses connect students, faculty, and staff directly from all key Hyderabad corridors into the Ghatkesar campus.
          </p>
        </div>
        <div className="corridors-grid">
          <div className="corridor-box east">
            <div className="corridor-title">⚡ Eastern & Warangal Highway</div>
            <div className="corridor-desc">NH-163 Corridor directly leading to Venkatapur campus</div>
            <div className="corridor-places">
              Uppal (BT-01), Ghatkesar (BT-04), Pocharam (BT-05), Medipally (BT-06), Boduppal (BT-07), Nacharam (BT-08), Habsiguda (BT-09)
            </div>
          </div>

          <div className="corridor-box north">
            <div className="corridor-title">🏢 Northern & ECIL Corridor</div>
            <div className="corridor-desc">Connecting Secunderabad, Malkajgiri, and Medchal hubs</div>
            <div className="corridor-places">
              Secunderabad (BT-11), Malkajgiri (BT-12), ECIL (BT-13), Kapra (BT-14), Sainikpuri (BT-15), Dammaiguda (BT-16), Keesara (BT-17), Cherlapally (BT-18)
            </div>
          </div>

          <div className="corridor-box south">
            <div className="corridor-title">🛣️ Southern & Outer Ring Road (ORR)</div>
            <div className="corridor-desc">Covering LB Nagar, Dilsukhnagar, Airport & Vijayawada Road</div>
            <div className="corridor-places">
              LB Nagar (BT-03), Dilsukhnagar (BT-19), Kothapet (BT-20), Vanasthalipuram (BT-21), Hayathnagar (BT-22), Ramoji Film City (BT-23), Ibrahimpatnam (BT-24), Nagole (BT-25), Shamshabad (BT-30)
            </div>
          </div>

          <div className="corridor-box west">
            <div className="corridor-title">🚆 Metro & Western Corridor</div>
            <div className="corridor-desc">Connecting Kukatpally, Miyapur, and Cyberabad metro belt</div>
            <div className="corridor-places">
              Kukatpally (BT-02), Tarnaka (BT-10), Ramanthapur (BT-26), Moosapet (BT-27), KPHB Colony (BT-28), Miyapur (BT-29)
            </div>
          </div>
        </div>
      </div>

      {/* 5. 30-Bus Fleet Matrix & Live Controls */}
      <div className="card">
        <div className="health-header">
          <div>
            <h2>🚌 Anurag University 30-Bus Fleet Matrix</h2>
            <p className="muted" style={{ margin: '3px 0 0', fontSize: '0.85rem' }}>
              Showing {filteredFleet.length} of {fleet.length} total buses connecting to campus.
            </p>
          </div>
          <div className="fleet-controls">
            <div className="filter-tabs">
              <button
                type="button"
                className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                All Buses ({fleet.length})
              </button>
              <button
                type="button"
                className={`filter-tab ${filter === 'ON_TIME' ? 'active' : ''}`}
                onClick={() => setFilter('ON_TIME')}
              >
                🟢 On Time ({onTimeCount})
              </button>
              <button
                type="button"
                className={`filter-tab ${filter === 'DELAYED' ? 'active' : ''}`}
                onClick={() => setFilter('DELAYED')}
              >
                ⚠️ Delayed ({delayedCount})
              </button>
              <button
                type="button"
                className={`filter-tab ${filter === 'GPS' ? 'active' : ''}`}
                onClick={() => setFilter('GPS')}
              >
                📡 GPS Active ({gpsActive.length})
              </button>
            </div>
            <input
              className="fleet-search"
              placeholder="Search bus, route, origin, or driver…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredFleet.length === 0 ? (
          <Empty>No buses match your filter.</Empty>
        ) : (
          <div className="bus-grid">
            {filteredFleet.map((b) => {
              const hasGps = Number.isFinite(b.latitude) && Number.isFinite(b.longitude);
              return (
                <div key={b.id} className="bus-item-card">
                  <div>
                    <div className="bus-card-head">
                      <span className="bus-number-chip">{b.busNumber}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="bus-route-title">{b.route ? b.route.name : 'Route not assigned'}</div>
                    <div className="bus-dest-flow">
                      <span>{b.route?.startPoint || 'Origin'}</span>
                      <span>➔</span>
                      <span className="dest-point">Anurag University</span>
                      {b.route?.distanceKm && <span>· {b.route.distanceKm} km</span>}
                    </div>

                    {b.statusNote && (
                      <div className="alert alert-warn small" style={{ padding: '6px 10px', marginBottom: '10px' }}>
                        {b.statusNote}
                      </div>
                    )}

                    <div className="bus-meta-list">
                      <div>
                        <span>Driver</span>
                        <strong>{b.driver ? b.driver.name : 'Not assigned'}</strong>
                      </div>
                      <div>
                        <span>Contact</span>
                        <strong>
                          {b.driver?.phone ? (
                            <a href={`tel:${b.driver.phone}`} style={{ color: 'inherit' }}>
                              📞 {b.driver.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Reg Number</span>
                        <strong>{b.registrationNumber}</strong>
                      </div>
                      <div>
                        <span>Capacity</span>
                        <strong>{b.capacity} Seats</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bus-card-footer">
                    {hasGps ? (
                      <a
                        href={mapUrl(b.latitude, b.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gps-link"
                      >
                        📍 Open GPS ({b.latitude.toFixed(2)}, {b.longitude.toFixed(2)}) ↗
                      </a>
                    ) : (
                      <span className="muted small">GPS pending</span>
                    )}
                    <Link to="/buses" className="small" style={{ fontWeight: 600 }}>
                      Manage →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Notifications Stream */}
      <div className="grid-main">
        <section className="card">
          <h2>Recent Campus Transit Announcements</h2>
          <NotificationList items={data.notifications} />
          <Link to="/notifications" className="link-more">Broadcast a new notification →</Link>
        </section>
        <section className="card">
          <h2>Campus Transportation Guidelines</h2>
          <p className="muted small" style={{ lineHeight: 1.6 }}>
            • Buses depart morning start points between 06:15 AM and 07:30 AM to arrive at Anurag University campus by 08:20 AM.
            <br />• Evening return trips depart campus main bus bay promptly at 04:30 PM.
            <br />• For emergency breakdowns or replacement buses, contact Transport Office: <strong>040-27654321</strong>.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Link to="/schedules" className="btn btn-sm">View Schedules</Link>
            <Link to="/students" className="btn btn-sm">Student Directory</Link>
          </div>
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

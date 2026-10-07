import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';
import { STATUS_LABELS } from '../utils.js';

const emptyForm = { busNumber: '', registrationNumber: '', capacity: 50, driverId: '', routeId: '' };

export default function Buses() {
  const { isAdmin } = useAuth();
  const [buses, setBuses] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {id?, ...form}
  const [statusFor, setStatusFor] = useState(null);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    try {
      const reqs = [api.get('/buses'), api.get('/routes')];
      if (isAdmin) reqs.push(api.get('/drivers'));
      const [b, r, d] = await Promise.all(reqs);
      setBuses(b.data);
      setRoutes(r.data);
      if (d) setDrivers(d.data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setModalError('');
    const payload = {
      busNumber: editing.busNumber,
      registrationNumber: editing.registrationNumber,
      capacity: Number(editing.capacity),
      driverId: editing.driverId ? Number(editing.driverId) : null,
      routeId: editing.routeId ? Number(editing.routeId) : null,
    };
    try {
      if (editing.id) await api.put(`/buses/${editing.id}`, payload);
      else await api.post('/buses', payload);
      setEditing(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const saveStatus = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await api.patch(`/buses/${statusFor.id}/status`, { status: statusFor.status, statusNote: statusFor.statusNote });
      setStatusFor(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const updateLocation = (bus) => {
    if (!navigator.geolocation) {
      setError('This browser cannot provide a GPS location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await api.patch(`/buses/${bus.id}/location`, { latitude: coords.latitude, longitude: coords.longitude });
          load();
        } catch (err) {
          setError(errMsg(err));
        }
      },
      () => setError('Location permission is required to update this bus location.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete bus ${b.busNumber}? Its schedules and notifications will be removed too.`)) return;
    try {
      await api.delete(`/buses/${b.id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const openEdit = (b) =>
    setEditing({ ...b, driverId: b.driver?.id ?? '', routeId: b.route?.id ?? '' });

  if (!buses) return error ? <ErrorBox message={error} /> : <Loading />;

  const shown = buses.filter((b) =>
    `${b.busNumber} ${b.route?.name || ''} ${b.driver?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Buses" subtitle="Fleet details, assigned routes and live status.">
        <input className="search" placeholder="Search buses…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setModalError(''); setEditing({ ...emptyForm }); }}>
            + Add bus
          </button>
        )}
      </PageHeader>
      <ErrorBox message={error} />

      {shown.length === 0 ? (
        <Empty>No buses found.</Empty>
      ) : (
        <div className="cards">
          {shown.map((b) => (
            <article key={b.id} className="card bus-card">
              <div className="bus-hero">
                <div className="bus-number">{b.busNumber}</div>
                <StatusBadge status={b.status} />
              </div>
              {b.statusNote && <div className="alert alert-warn">{b.statusNote}</div>}
              <dl className="kv">
                <dt>Route</dt>
                <dd>{b.route ? b.route.name : 'Not assigned'}</dd>
                <dt>Driver</dt>
                <dd>{b.driver ? `${b.driver.name} · ${b.driver.phone}` : 'Not assigned'}</dd>
                <dt>Capacity</dt>
                <dd>{b.capacity} seats</dd>
                <dt>Registration</dt>
                <dd>{b.registrationNumber}</dd>
              </dl>
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => { setModalError(''); setStatusFor({ id: b.id, status: b.status, statusNote: b.statusNote || '' }); }}>
                    Update status
                  </button>
                  <button className="btn btn-sm" onClick={() => updateLocation(b)}>Update GPS</button>
                  <button className="btn btn-sm" onClick={() => { setModalError(''); openEdit(b); }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(b)}>Delete</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit bus' : 'Add bus'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <ErrorBox message={modalError} />
            <div className="grid-2">
              <label>Bus number<input required value={editing.busNumber} onChange={(e) => setEditing({ ...editing, busNumber: e.target.value })} /></label>
              <label>Capacity<input type="number" min="1" required value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: e.target.value })} /></label>
            </div>
            <label>Registration number<input required value={editing.registrationNumber} onChange={(e) => setEditing({ ...editing, registrationNumber: e.target.value })} /></label>
            <label>Driver
              <select value={editing.driverId} onChange={(e) => setEditing({ ...editing, driverId: e.target.value })}>
                <option value="">— None —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label>Route
              <select value={editing.routeId} onChange={(e) => setEditing({ ...editing, routeId: e.target.value })}>
                <option value="">— None —</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {statusFor && (
        <Modal title="Update bus status" onClose={() => setStatusFor(null)}>
          <form onSubmit={saveStatus} className="form">
            <ErrorBox message={modalError} />
            <label>Status
              <select value={statusFor.status} onChange={(e) => setStatusFor({ ...statusFor, status: e.target.value })}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>Note for students (optional)
              <input placeholder="e.g. Running 15 minutes late due to traffic" value={statusFor.statusNote} onChange={(e) => setStatusFor({ ...statusFor, statusNote: e.target.value })} />
            </label>
            <p className="muted small">Students on this bus are notified when the status changes.</p>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setStatusFor(null)}>Cancel</button>
              <button className="btn btn-primary">Update</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

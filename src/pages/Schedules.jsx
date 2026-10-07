import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';
import { DAYS, fmtTime, toInputTime } from '../utils.js';

const emptyForm = {
  busId: '',
  trip: 'MORNING',
  departureTime: '06:30',
  arrivalTime: '08:45',
  days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
};

export default function Schedules() {
  const { isAdmin } = useAuth();
  const [schedules, setSchedules] = useState(null);
  const [buses, setBuses] = useState([]);
  const [busFilter, setBusFilter] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api.get('/schedules', { params: busFilter ? { busId: busFilter } : {} }), api.get('/buses')]);
      setSchedules(s.data);
      setBuses(b.data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [busFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDay = (d) =>
    setEditing({ ...editing, days: editing.days.includes(d) ? editing.days.filter((x) => x !== d) : [...editing.days, d] });

  const save = async (e) => {
    e.preventDefault();
    setModalError('');
    if (editing.days.length === 0) return setModalError('Select at least one day');
    const payload = {
      busId: Number(editing.busId),
      trip: editing.trip,
      departureTime: editing.departureTime,
      arrivalTime: editing.arrivalTime,
      days: DAYS.filter((d) => editing.days.includes(d)).join(','),
    };
    try {
      if (editing.id) await api.put(`/schedules/${editing.id}`, payload);
      else await api.post('/schedules', payload);
      setEditing(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const remove = async (s) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/schedules/${s.id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!schedules) return error ? <ErrorBox message={error} /> : <Loading />;

  return (
    <>
      <PageHeader title="Schedules" subtitle="Morning and evening trips for every bus.">
        <select className="search" value={busFilter} onChange={(e) => setBusFilter(e.target.value)}>
          <option value="">All buses</option>
          {buses.map((b) => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
        </select>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setModalError(''); setEditing({ ...emptyForm, busId: buses[0]?.id ?? '' }); }}>
            + Add schedule
          </button>
        )}
      </PageHeader>
      <ErrorBox message={error} />

      {schedules.length === 0 ? (
        <Empty>No schedules found.</Empty>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Bus</th><th>Route</th><th>Trip</th><th>Departs</th><th>Arrives</th><th>Days</th>{isAdmin && <th></th>}</tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.bus.busNumber}</strong></td>
                  <td>{s.bus.route?.name || '—'}</td>
                  <td>{s.trip === 'MORNING' ? 'Morning' : 'Evening'}</td>
                  <td>{fmtTime(s.departureTime)}</td>
                  <td>{fmtTime(s.arrivalTime)}</td>
                  <td>{s.days.split(',').map((d) => <span key={d} className="chip">{d}</span>)}</td>
                  {isAdmin && (
                    <td className="row-actions">
                      <button className="btn btn-sm" onClick={() => { setModalError(''); setEditing({ id: s.id, busId: s.bus.id, trip: s.trip, departureTime: toInputTime(s.departureTime), arrivalTime: toInputTime(s.arrivalTime), days: s.days.split(',') }); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit schedule' : 'Add schedule'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <ErrorBox message={modalError} />
            <div className="grid-2">
              <label>Bus
                <select required value={editing.busId} onChange={(e) => setEditing({ ...editing, busId: e.target.value })}>
                  <option value="" disabled>Select bus</option>
                  {buses.map((b) => <option key={b.id} value={b.id}>{b.busNumber}</option>)}
                </select>
              </label>
              <label>Trip
                <select value={editing.trip} onChange={(e) => setEditing({ ...editing, trip: e.target.value })}>
                  <option value="MORNING">Morning (to college)</option>
                  <option value="EVENING">Evening (to home)</option>
                </select>
              </label>
            </div>
            <div className="grid-2">
              <label>Departure<input type="time" required value={editing.departureTime} onChange={(e) => setEditing({ ...editing, departureTime: e.target.value })} /></label>
              <label>Arrival<input type="time" required value={editing.arrivalTime} onChange={(e) => setEditing({ ...editing, arrivalTime: e.target.value })} /></label>
            </div>
            <div>
              <strong>Runs on</strong>
              <div className="day-picks">
                {DAYS.map((d) => (
                  <button type="button" key={d} className={editing.days.includes(d) ? 'day-pick on' : 'day-pick'} onClick={() => toggleDay(d)}>{d}</button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

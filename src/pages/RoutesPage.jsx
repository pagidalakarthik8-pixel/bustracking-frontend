import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';
import { fmtTime, toInputTime } from '../utils.js';

const emptyForm = { name: '', startPoint: '', endPoint: '', distanceKm: '', stops: [{ name: '', pickupTime: '' }] };

export default function RoutesPage() {
  const { isAdmin } = useAuth();
  const [routes, setRoutes] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState('');

  const load = useCallback(() => {
    api.get('/routes').then((r) => setRoutes(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(load, [load]);

  const openEdit = (r) =>
    setEditing({
      id: r.id,
      name: r.name,
      startPoint: r.startPoint,
      endPoint: r.endPoint,
      distanceKm: r.distanceKm ?? '',
      stops: r.stops.length ? r.stops.map((s) => ({ name: s.name, pickupTime: toInputTime(s.pickupTime) })) : [{ name: '', pickupTime: '' }],
    });

  const setStop = (i, patch) =>
    setEditing({ ...editing, stops: editing.stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  const save = async (e) => {
    e.preventDefault();
    setModalError('');
    const payload = {
      name: editing.name,
      startPoint: editing.startPoint,
      endPoint: editing.endPoint,
      distanceKm: editing.distanceKm === '' ? null : Number(editing.distanceKm),
      stops: editing.stops
        .filter((s) => s.name.trim())
        .map((s, i) => ({ name: s.name, stopOrder: i + 1, pickupTime: s.pickupTime || null })),
    };
    try {
      if (editing.id) await api.put(`/routes/${editing.id}`, payload);
      else await api.post('/routes', payload);
      setEditing(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete route "${r.name}"? Buses on this route will become unassigned.`)) return;
    try {
      await api.delete(`/routes/${r.id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!routes) return error ? <ErrorBox message={error} /> : <Loading />;

  return (
    <>
      <PageHeader title="Routes & stops" subtitle="Every route with its stops and approximate pick-up times.">
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setModalError(''); setEditing({ ...emptyForm, stops: [{ name: '', pickupTime: '' }] }); }}>
            + Add route
          </button>
        )}
      </PageHeader>
      <ErrorBox message={error} />

      {routes.length === 0 ? (
        <Empty>No routes yet.</Empty>
      ) : (
        <div className="cards">
          {routes.map((r) => (
            <article key={r.id} className="card">
              <h2>{r.name}</h2>
              <p className="muted">
                {r.startPoint} → {r.endPoint}
                {r.distanceKm ? ` · ${r.distanceKm} km` : ''}
              </p>
              {r.stops.length === 0 ? (
                <p className="muted small">No stops added.</p>
              ) : (
                <ol className="timeline">
                  {r.stops.map((s) => (
                    <li key={s.id}>
                      <span>{s.name}</span>
                      <span className="muted">{fmtTime(s.pickupTime)}</span>
                    </li>
                  ))}
                </ol>
              )}
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn btn-sm" onClick={() => { setModalError(''); openEdit(r); }}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(r)}>Delete</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit route' : 'Add route'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <ErrorBox message={modalError} />
            <label>Route name<input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <div className="grid-3">
              <label>Start point<input required value={editing.startPoint} onChange={(e) => setEditing({ ...editing, startPoint: e.target.value })} /></label>
              <label>End point<input required value={editing.endPoint} onChange={(e) => setEditing({ ...editing, endPoint: e.target.value })} /></label>
              <label>Distance (km)<input type="number" step="0.1" min="0" value={editing.distanceKm} onChange={(e) => setEditing({ ...editing, distanceKm: e.target.value })} /></label>
            </div>
            <div>
              <div className="label-row">
                <strong>Stops (in order)</strong>
                <button type="button" className="btn btn-sm" onClick={() => setEditing({ ...editing, stops: [...editing.stops, { name: '', pickupTime: '' }] })}>+ Add stop</button>
              </div>
              {editing.stops.map((s, i) => (
                <div className="stop-row" key={i}>
                  <span className="stop-idx">{i + 1}</span>
                  <input placeholder="Stop name" value={s.name} onChange={(e) => setStop(i, { name: e.target.value })} />
                  <input type="time" value={s.pickupTime} onChange={(e) => setStop(i, { pickupTime: e.target.value })} />
                  <button type="button" className="icon-btn" aria-label="Remove stop" onClick={() => setEditing({ ...editing, stops: editing.stops.filter((_, idx) => idx !== i) })}>✕</button>
                </div>
              ))}
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

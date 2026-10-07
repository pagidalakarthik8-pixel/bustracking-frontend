import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';

export default function Students() {
  const [students, setStudents] = useState(null);
  const [buses, setBuses] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api.get('/admin/students'), api.get('/buses')]);
      setStudents(s.data);
      setBuses(b.data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await api.put(`/admin/students/${editing.id}/bus`, {
        busId: editing.busId ? Number(editing.busId) : null,
        boardingStop: editing.boardingStop || null,
      });
      setEditing(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove student ${s.name}?`)) return;
    try {
      await api.delete(`/admin/students/${s.id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!students) return error ? <ErrorBox message={error} /> : <Loading />;

  const shown = students.filter((s) =>
    `${s.name} ${s.email} ${s.rollNumber || ''}`.toLowerCase().includes(search.toLowerCase())
  );
  const selectedBus = editing && buses.find((b) => String(b.id) === String(editing.busId));

  return (
    <>
      <PageHeader title="Students" subtitle="Student transportation assignments.">
        <input className="search" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </PageHeader>
      <ErrorBox message={error} />
      {shown.length === 0 ? (
        <Empty>No students found.</Empty>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Roll no.</th><th>Contact</th><th>Bus</th><th>Boarding stop</th><th></th></tr></thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong><div className="muted small">{s.email}</div></td>
                  <td>{s.rollNumber || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.busNumber || '—'}</td>
                  <td>{s.boardingStop || '—'}</td>
                  <td className="row-actions">
                    <button className="btn btn-sm" onClick={() => { setModalError(''); setEditing({ id: s.id, name: s.name, busId: s.busId ?? '', boardingStop: s.boardingStop || '' }); }}>Assign bus</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={`Assign bus — ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <ErrorBox message={modalError} />
            <label>Bus
              <select value={editing.busId} onChange={(e) => setEditing({ ...editing, busId: e.target.value, boardingStop: '' })}>
                <option value="">— No bus —</option>
                {buses.map((b) => <option key={b.id} value={b.id}>{b.busNumber}{b.route ? ` · ${b.route.name}` : ''}</option>)}
              </select>
            </label>
            <label>Boarding stop
              {selectedBus?.route?.stops?.length ? (
                <select value={editing.boardingStop} onChange={(e) => setEditing({ ...editing, boardingStop: e.target.value })}>
                  <option value="">— Select stop —</option>
                  {selectedBus.route.stops.map((st) => <option key={st.id} value={st.name}>{st.name}</option>)}
                </select>
              ) : (
                <input value={editing.boardingStop} onChange={(e) => setEditing({ ...editing, boardingStop: e.target.value })} />
              )}
            </label>
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

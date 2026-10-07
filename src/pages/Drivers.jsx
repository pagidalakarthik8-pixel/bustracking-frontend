import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';

const emptyForm = { name: '', phone: '', licenseNumber: '' };

export default function Drivers() {
  const [drivers, setDrivers] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState('');

  const load = useCallback(() => {
    api.get('/drivers').then((r) => setDrivers(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(load, [load]);

  const save = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const { id, ...payload } = editing;
      if (id) await api.put(`/drivers/${id}`, payload);
      else await api.post('/drivers', payload);
      setEditing(null);
      load();
    } catch (err) {
      setModalError(errMsg(err));
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete driver ${d.name}? Their buses will become unassigned.`)) return;
    try {
      await api.delete(`/drivers/${d.id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!drivers) return error ? <ErrorBox message={error} /> : <Loading />;

  return (
    <>
      <PageHeader title="Drivers" subtitle="Driver contact and license details.">
        <button className="btn btn-primary" onClick={() => { setModalError(''); setEditing({ ...emptyForm }); }}>+ Add driver</button>
      </PageHeader>
      <ErrorBox message={error} />
      {drivers.length === 0 ? (
        <Empty>No drivers yet.</Empty>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>License</th><th></th></tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.phone}</td>
                  <td>{d.licenseNumber}</td>
                  <td className="row-actions">
                    <button className="btn btn-sm" onClick={() => { setModalError(''); setEditing({ ...d }); }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(d)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit driver' : 'Add driver'} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="form">
            <ErrorBox message={modalError} />
            <label>Name<input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label>Phone<input required value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label>
            <label>License number<input required value={editing.licenseNumber} onChange={(e) => setEditing({ ...editing, licenseNumber: e.target.value })} /></label>
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

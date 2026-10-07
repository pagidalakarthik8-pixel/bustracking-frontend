import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ErrorBox, Loading } from '../components/Feedback.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [buses, setBuses] = useState(null);
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    rollNumber: user.rollNumber || '',
    busId: user.busId ?? '',
    boardingStop: user.boardingStop || '',
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/buses').then((r) => setBuses(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const set = (k) => (e) => {
    setSaved(false);
    setForm({ ...form, [k]: e.target.value });
  };

  const selectedBus = buses?.find((b) => String(b.id) === String(form.busId));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.put('/auth/me', { ...form, busId: form.busId ? Number(form.busId) : null });
      setUser(res.data);
      setSaved(true);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!buses) return error ? <ErrorBox message={error} /> : <Loading />;

  return (
    <>
      <PageHeader title="My profile" subtitle="Keep your details and bus up to date to receive the right notifications." />
      <form className="card form narrow" onSubmit={save}>
        <ErrorBox message={error} />
        {saved && <div className="alert alert-ok">Profile saved.</div>}
        <label>Email<input value={user.email} disabled /></label>
        <label>Full name<input required value={form.name} onChange={set('name')} /></label>
        <div className="grid-2">
          <label>Roll number<input value={form.rollNumber} onChange={set('rollNumber')} /></label>
          <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
        </div>
        <label>My bus
          <select value={form.busId} onChange={(e) => { setSaved(false); setForm({ ...form, busId: e.target.value, boardingStop: '' }); }}>
            <option value="">— Not selected —</option>
            {buses.map((b) => <option key={b.id} value={b.id}>{b.busNumber}{b.route ? ` · ${b.route.name}` : ''}</option>)}
          </select>
        </label>
        <label>Boarding stop
          {selectedBus?.route?.stops?.length ? (
            <select value={form.boardingStop} onChange={set('boardingStop')}>
              <option value="">— Select stop —</option>
              {selectedBus.route.stops.map((st) => <option key={st.id} value={st.name}>{st.name}</option>)}
            </select>
          ) : (
            <input value={form.boardingStop} onChange={set('boardingStop')} />
          )}
        </label>
        <div className="form-actions">
          <button className="btn btn-primary">Save changes</button>
        </div>
      </form>
    </>
  );
}

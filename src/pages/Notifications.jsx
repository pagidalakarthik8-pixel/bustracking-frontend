import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';
import { fmtDateTime } from '../utils.js';

export default function Notifications() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState(null);
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', busId: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const reqs = [api.get('/notifications')];
      if (isAdmin) reqs.push(api.get('/buses'));
      const [n, b] = await Promise.all(reqs);
      setItems(n.data);
      if (b) setBuses(b.data);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post('/notifications', { ...form, busId: form.busId ? Number(form.busId) : null });
      setForm({ title: '', message: '', busId: '' });
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (n) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await api.delete(`/notifications/${n.id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!items) return error ? <ErrorBox message={error} /> : <Loading />;

  return (
    <>
      <PageHeader title="Notifications" subtitle={isAdmin ? 'Announcements and bus status alerts sent to students.' : 'Announcements for everyone and alerts for your bus.'} />
      <ErrorBox message={error} />

      {isAdmin && (
        <form className="card form" onSubmit={send}>
          <h2>Send a notification</h2>
          <div className="grid-2">
            <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Send to
              <select value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })}>
                <option value="">All students</option>
                {buses.map((b) => <option key={b.id} value={b.id}>Students on {b.busNumber}</option>)}
              </select>
            </label>
          </div>
          <label>Message<textarea required rows={3} maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <Empty>No notifications yet.</Empty>
      ) : (
        <div className="card">
          <ul className="notif-list">
            {items.map((n) => (
              <li key={n.id}>
                <div className="notif-title">
                  {n.title}
                  <span className="chip">{n.bus ? n.bus.busNumber : 'Everyone'}</span>
                </div>
                <div>{n.message}</div>
                <div className="muted small">
                  {fmtDateTime(n.createdAt)}
                  {isAdmin && <button className="link-btn" onClick={() => remove(n)}>Delete</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

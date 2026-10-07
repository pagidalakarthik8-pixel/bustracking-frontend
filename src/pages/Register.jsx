import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import { ErrorBox } from '../components/Feedback.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', phone: '', busId: '', boardingStop: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ ...form, busId: form.busId ? Number(form.busId) : null });
      navigate('/dashboard');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand brand-lg">
          <span className="brand-mark">🚌</span> Anurag University Bus Tracking
        </div>
        <p className="muted">Create a student account. You can pick your bus later from your profile.</p>
        <ErrorBox message={error} />
        <label>
          Full name
          <input required value={form.name} onChange={set('name')} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={set('email')} />
        </label>
        <label>
          Password
          <input type="password" required minLength={6} value={form.password} onChange={set('password')} />
        </label>
        <div className="grid-2">
          <label>
            Roll number
            <input value={form.rollNumber} onChange={set('rollNumber')} />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={set('phone')} />
          </label>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="muted center">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

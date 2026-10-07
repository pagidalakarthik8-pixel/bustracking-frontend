import { STATUS_LABELS } from '../utils.js';

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${(status || '').toLowerCase()}`}>{STATUS_LABELS[status] || status}</span>;
}

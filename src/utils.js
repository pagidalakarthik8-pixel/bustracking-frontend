/** "07:05:00" -> "7:05 AM" */
export function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "07:05:00" -> "07:05" (value for <input type="time">) */
export const toInputTime = (t) => (t ? t.slice(0, 5) : '');

export function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const STATUS_LABELS = {
  ON_TIME: 'On time',
  DELAYED: 'Delayed',
  NOT_RUNNING: 'Not running',
  MAINTENANCE: 'Maintenance',
};

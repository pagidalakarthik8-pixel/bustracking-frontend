export function ErrorBox({ message }) {
  return message ? <div className="alert alert-error">{message}</div> : null;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Loading() {
  return <div className="empty">Loading…</div>;
}

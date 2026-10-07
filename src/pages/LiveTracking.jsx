import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Empty, ErrorBox, Loading } from '../components/Feedback.jsx';

const mapUrl = (latitude, longitude) =>
  `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

function updatedAt(value) {
  if (!value) return 'Location not received yet';
  return `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))}`;
}

export default function LiveTracking() {
  const [buses, setBuses] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/buses');
      setBuses(data);
      setError('');
    } catch (err) {
      setError(errMsg(err));
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = window.setInterval(load, 30000);
    return () => window.clearInterval(refresh);
  }, [load]);

  if (!buses) return error ? <ErrorBox message={error} /> : <Loading />;

  return (
    <>
      <PageHeader title="Live bus tracking" subtitle="Latest GPS positions for every college bus. Refreshes every 30 seconds.">
        <button className="btn" onClick={load}>Refresh now</button>
      </PageHeader>
      <ErrorBox message={error} />
      {buses.length === 0 ? <Empty>No buses are available.</Empty> : (
        <div className="cards">
          {buses.map((bus) => {
            const hasLocation = Number.isFinite(bus.latitude) && Number.isFinite(bus.longitude);
            return (
              <article className="card tracking-card" key={bus.id}>
                <div className="bus-hero"><div className="bus-number">{bus.busNumber}</div><StatusBadge status={bus.status} /></div>
                <p className="muted">{bus.route?.name || 'Route not assigned'}</p>
                {hasLocation ? (
                  <>
                    <div className="gps-coordinates">GPS active</div>
                    <p className="tracking-time">{updatedAt(bus.locationUpdatedAt)}</p>
                    <a className="btn btn-primary map-link" href={mapUrl(bus.latitude, bus.longitude)} target="_blank" rel="noreferrer">Open live location</a>
                  </>
                ) : <div className="location-pending">GPS location is not available for this bus yet.</div>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

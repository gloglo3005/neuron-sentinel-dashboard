import { useEffect } from 'react';
import { useDataSource } from './useDataSource';
import { alertsService, adaptAlert } from '../services/alertsService';
import { initialAlerts } from '../data/alerts';
import { onSocketEvent } from '../realtime/socket';

export function useAlerts() {
  const { data, loading, error, source, setData, refresh } = useDataSource(
    () => alertsService.list(),
    () => initialAlerts,
    []
  );

  // Only meaningful once we're actually talking to the real backend — in
  // mock mode there's no socket server to connect to (see
  // src/realtime/socket.js), so these are silent no-ops.
  useEffect(() => {
    if (source !== 'real') return undefined;
    const upsert = (raw) => {
      const updated = adaptAlert(raw);
      setData((prev) => {
        const list = prev ?? [];
        const exists = list.some((a) => a.id === updated.id);
        return exists ? list.map((a) => (a.id === updated.id ? updated : a)) : [updated, ...list];
      });
    };
    const offCreated = onSocketEvent('alert.created', upsert);
    const offUpdated = onSocketEvent('alert.updated', upsert);
    const offDispatched = onSocketEvent('alert.dispatched', upsert);
    return () => {
      offCreated();
      offUpdated();
      offDispatched();
    };
  }, [source, setData]);

  return {
    alerts: data ?? [],
    // Lets pages still call setAlerts directly for their own optimistic
    // updates (e.g. Alerts.jsx while an action request is in flight).
    setAlerts: setData,
    loading,
    error,
    source,
    refresh,
  };
}
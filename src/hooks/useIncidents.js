import { useEffect } from 'react';
import { useDataSource } from './useDataSource';
import { incidentsService, adaptIncident } from '../services/incidentsService';
import { initialIncidents } from '../data/incidents';
import { onSocketEvent } from '../realtime/socket';

export function useIncidents() {
  const { data, loading, error, source, setData, refresh } = useDataSource(
    () => incidentsService.list(),
    () => initialIncidents,
    []
  );

  // Real-time only in 'real' mode — mock mode has no socket server to
  // connect to (see src/realtime/socket.js). Backend already emits
  // incident.created on every new citizen report.
  useEffect(() => {
    if (source !== 'real') return undefined;
    const upsert = (raw) => {
      const updated = adaptIncident(raw);
      setData((prev) => {
        const list = prev ?? [];
        const exists = list.some((i) => i.id === updated.id);
        return exists ? list.map((i) => (i.id === updated.id ? updated : i)) : [updated, ...list];
      });
    };
    const offCreated = onSocketEvent('incident.created', upsert);
    return () => {
      offCreated();
    };
  }, [source, setData]);

  return {
    incidents: data ?? [],
    setIncidents: setData,
    loading,
    error,
    source,
    refresh,
  };
}
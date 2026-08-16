import { useMemo, useState } from 'react';
import { TopBar } from '../components/TopNav';
import { Card, Btn, DataSourceBadge } from '../components/ui';
import { useIncidents } from '../hooks/useIncidents';
import { useZones } from '../hooks/useZones';
import { useAuth } from '../context/AuthContext';
import { incidentsService, statusMeta } from '../services/incidentsService';
import { typeLabels } from '../data/incidents';

const STATUS_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'VERIFYING', label: 'En vérification' },
  { key: 'CONFIRMED', label: 'Confirmés' },
  { key: 'REJECTED', label: 'Rejetés' },
];

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full inline-block"
      style={{ background: meta.soft, color: meta.color }}
    >
      {meta.label.toUpperCase()}
    </span>
  );
}

function IncidentCard({ incident, canModerate, onVerify, pending }) {
  const isOpen = incident.status === 'PENDING' || incident.status === 'VERIFYING';
  const hasMedia = incident.media.length > 0;

  return (
    <div
      className={`bg-surface border border-border rounded-xl2 shadow-card overflow-hidden p-4 flex gap-3.5 ${
        !isOpen ? 'opacity-75' : ''
      }`}
    >
      <div
        className="w-16 h-16 rounded-[10px] flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
        style={{
          background: hasMedia ? '#E7EFFD' : '#F1F4F9',
          color: hasMedia ? '#2E6FDE' : '#96A1B3',
        }}
      >
        {hasMedia ? `${incident.media.length} photo${incident.media.length > 1 ? 's' : ''}` : 'Sans photo'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-bold text-[13.5px] text-text-primary">
            {typeLabels[incident.type] || incident.type}
          </span>
          <StatusBadge status={incident.status} />
        </div>
        {incident.description && (
          <div className="text-[12px] text-text-secondary mb-1.5 leading-snug">{incident.description}</div>
        )}
        <div className="text-[11px] text-text-tertiary">
          Zone {incident.zoneName} · {incident.reporterName} · {incident.latitude?.toFixed(3)}, {incident.longitude?.toFixed(3)} · {incident.time}
        </div>
      </div>

      {canModerate && isOpen && (
        <div className="flex flex-col gap-1.5 flex-shrink-0 justify-center">
          <Btn variant="primary" disabled={pending} onClick={() => onVerify(incident.id, 'CONFIRMED')}>
            Confirmer
          </Btn>
          <Btn variant="ghost" disabled={pending} onClick={() => onVerify(incident.id, 'REJECTED')}>
            Rejeter
          </Btn>
          {incident.status === 'PENDING' && (
            <Btn variant="ghost" disabled={pending} onClick={() => onVerify(incident.id, 'VERIFYING')}>
              À vérifier
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

export default function IncidentReports() {
  const { incidents, setIncidents, loading, source } = useIncidents();
  const { zoneNames } = useZones();
  const { user } = useAuth();
  // Mirrors backend's requireCapability('canConfirm') on POST
  // /api/incidents/:id/verify — a read-only account never sees the action
  // buttons even though the same list endpoint is open to it.
  const canModerate = user?.canWrite !== false;

  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [actionPendingId, setActionPendingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const counts = useMemo(() => {
    const c = { all: incidents.length };
    for (const tab of STATUS_TABS.slice(1)) {
      c[tab.key] = incidents.filter((i) => i.status === tab.key).length;
    }
    return c;
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents
      .filter((i) => statusFilter === 'all' || i.status === statusFilter)
      .filter((i) => zoneFilter === 'all' || i.zoneName === zoneFilter)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [incidents, statusFilter, zoneFilter]);

  async function handleVerify(id, decision) {
    setActionError(null);
    setActionPendingId(id);
    try {
      const updated = await incidentsService.verify(id, decision);
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      // In mock mode there's no backend to call — apply the transition
      // locally so the demo stays interactive.
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: decision, verifiedAt: new Date().toISOString() } : i))
      );
      if (source === 'real') setActionError(err.message || "Impossible d'enregistrer la décision.");
    } finally {
      setActionPendingId(null);
    }
  }

  return (
    <div className="flex-1 bg-app">
      <TopBar title="Signalements citoyens" />
      <div className="p-7">
        <Card
          title="Rapports reçus depuis l'application citoyenne"
          subtitle={`${counts.all} signalement${counts.all > 1 ? 's' : ''} au total · ${counts.PENDING || 0} en attente de validation`}
          right={<DataSourceBadge source={source} loading={loading} />}
        >
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-[11.5px] font-bold whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-brand text-white'
                    : 'bg-surface border border-border text-text-secondary'
                }`}
              >
                {tab.label} ({counts[tab.key] ?? 0})
              </button>
            ))}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="ml-auto bg-surface border border-border text-text-secondary rounded-lg px-3 py-2 text-[11.5px]"
            >
              <option value="all">Toutes les zones</option>
              {zoneNames.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {actionError && (
            <div className="mb-3 text-[12px] text-risk-high bg-risk-high-soft px-3 py-2 rounded-lg">
              {actionError}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-[12.5px] text-text-tertiary py-8 text-center">
              Aucun signalement pour ce filtre.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  canModerate={canModerate}
                  pending={actionPendingId === incident.id}
                  onVerify={handleVerify}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
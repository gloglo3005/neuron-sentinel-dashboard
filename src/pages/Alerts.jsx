import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopNav';
import { Card, RiskBadge, Btn, DataSourceBadge } from '../components/ui';
import { roles, statusMeta, openStatuses, roleColorOf, roleLabelOf } from '../data/alerts';
import { levelOf, riskColor, zoneNames as allZoneNames } from '../data/zones';
import { useAlerts } from '../hooks/useAlerts';
import { useZones } from '../hooks/useZones';
import { useAuth } from '../context/AuthContext';
import { alertsService } from '../services/alertsService';

// Mirrors backend/src/utils/permissions.js exactly — the frontend only
// decides which buttons to *show*, the backend is what actually enforces
// each action (see requireCapability() on every mutating route). A read-only
// account (canWrite: false, e.g. the Observateur/ONG demo login) is always
// treated as 'observateur' regardless of its underlying role.
const ORG_KEY_OF_ROLE = { CIVIL_PROTECTION: 'anpc', AUTHORITY: 'mairie', EMERGENCY_SERVICE: 'pompiers' };

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

// Worst-case risk level across a set of zones, used both to badge a
// multi-zone alert and to pre-fill the level when composing one.
function worstLevel(zoneList, riskGuess) {
  const order = { low: 0, medium: 1, high: 2 };
  return zoneList.reduce((worst, z) => (order[riskGuess[z]] > order[worst] ? riskGuess[z] : worst), 'low');
}

export default function Alerts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Real role from the JWT session — no more switching roles from a
  // dropdown. canWrite:false (read-only demo accounts) always maps to
  // 'observateur', same as the backend's can() check.
  const currentRole = user?.canWrite === false ? 'observateur' : ORG_KEY_OF_ROLE[user?.role] || 'observateur';
  const { alerts, setAlerts, loading, source } = useAlerts();
  const [actionError, setActionError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  // Guards sendCompose() the same way pendingId guards runAction() above —
  // sendCompose *prepends* to the list on success rather than map()-ing an
  // existing entry, so without this, a double-click (or a slow network +
  // an impatient re-click) fires two POST /api/alerts and creates two
  // real, distinct Alert rows — duplicate cards that persist across
  // refreshes because they're genuinely duplicated server-side, not a
  // rendering glitch.
  const [composing, setComposing] = useState(false);
  const { zones, loading: zonesLoading } = useZones();
  // Derived from the live zone dataset instead of a separate hard-coded
  // table, so it always matches what the risk map is currently showing.
  const zoneRiskGuess = useMemo(() => {
    const guess = {};
    for (const [name, z] of Object.entries(zones)) guess[name] = levelOf(z.series[0]);
    return guess;
  }, [zones]);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [rejectTarget, setRejectTarget] = useState(null); // alert id awaiting a rejection reason
  const [rejectReason, setRejectReason] = useState('');

  const [composeZones, setComposeZones] = useState(new Set());
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState(new Set(['SMS', 'Push']));
  const [audience, setAudience] = useState('both');

  const r = { ...roles[currentRole], name: user?.name || roles[currentRole].name, initials: initialsOf(user?.name) || roles[currentRole].initials };

  // Arriving from AIPredictions.jsx's "Examiner l'alerte" action: reuse an
  // existing proposed alert for that zone, or create one sourced from the
  // model's prediction (spec section 8 — a prediction never becomes an
  // official alert by itself, an authority must still review it here).
  const processedNavKey = useRef(null);
  useEffect(() => {
    const proposeZone = location.state?.proposeZone;
    const predictionId = location.state?.predictionId;
    if (!proposeZone || loading || zonesLoading) return;
    // React.StrictMode (see main.jsx) intentionally double-invokes effects
    // in dev to surface side-effect bugs — without this guard, that would
    // fire alertsService.create() twice per click and create two real
    // alerts server-side. location.key is unique per navigation entry, so
    // this only allows the body below to run once for a given "Examiner
    // l'alerte" click, regardless of how many times the effect itself runs.
    if (processedNavKey.current === location.key) return;
    processedNavKey.current = location.key;

    // Clear the navigation state immediately so a refresh/back doesn't
    // re-trigger this, and so a failed create doesn't retry in a loop.
    navigate(location.pathname, { replace: true, state: {} });

    // Ask the server, not the local `alerts` list — a double-click, or
    // navigating back to AIPredictions and clicking "Examiner l'alerte"
    // again a few seconds later, would both land here with a fresh
    // location.key (the guard above only catches same-key StrictMode
    // double-invokes). Querying live PROPOSED alerts for this zone closes
    // that race instead of trusting a local list that might not have
    // caught up yet.
    const zoneId = zones[proposeZone]?.id;
    if (!zoneId) {
      setActionError(`Zone "${proposeZone}" introuvable côté serveur.`);
      return;
    }
    alertsService
      .list({ status: 'PROPOSED', zoneId })
      .then((live) => {
        const existing = live.find((a) => a.source === 'prediction');
        if (existing) {
          setAlerts((prev) => (prev.some((a) => a.id === existing.id) ? prev : [existing, ...prev]));
          setExpandedId(existing.id);
          return null; // signal: don't create
        }
        return alertsService.create({
          title: `Prédiction IA — risque d'inondation à ${proposeZone}`,
          type: "Prédiction IA — risque d'inondation",
          severity: SEVERITY_OF_LEVEL[zoneRiskGuess[proposeZone] || 'medium'],
          source: 'PREDICTION',
          predictionId: predictionId || undefined,
          zoneIds: [zoneId],
        });
      })
      .then((created) => {
        if (!created) return; // an existing proposed alert was reused instead
        setAlerts((prev) => (prev.some((a) => a.id === created.id) ? prev : [created, ...prev]));
        setExpandedId(created.id);
      })
      .catch((err) => setActionError(`Proposition depuis la prédiction impossible — ${err.message || 'Une erreur est survenue.'}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, loading, zonesLoading]);

  // Arriving from RiskMap.jsx's "Créer une alerte" button — just pre-fill
  // the compose panel with that zone, the authority still writes and
  // proposes the alert themselves (spec section 9: alerts can also be
  // created manually by an authorized authority).
  useEffect(() => {
    const presetZone = location.state?.presetZone;
    if (!presetZone) return;
    setComposeZones(new Set([presetZone]));
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (search && !a.zones.some((z) => z.toLowerCase().includes(search.toLowerCase()))) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (levelFilter !== 'all' && a.level !== levelFilter) return false;
      return true;
    });
  }, [alerts, search, statusFilter, levelFilter]);

  if (loading || zonesLoading) {
    return (
      <div>
        <TopBar title="Gestion des alertes" />
        <div className="px-7 py-10 text-center text-text-tertiary text-[13px]">Chargement des alertes…</div>
      </div>
    );
  }

  const active = alerts.filter((a) => openStatuses.includes(a.status)).length;
  const high = alerts.filter((a) => openStatuses.includes(a.status) && a.level === 'high').length;
  const awaitingReview = alerts.filter((a) => a.status === 'PROPOSED' || a.status === 'UNDER_REVIEW');
  const trackedAlerts = alerts.filter((a) => ['DISPATCHED', 'ACTIVE', 'RESOLVED', 'CLOSED'].includes(a.status) && a.channels.length);
  const avgAck = trackedAlerts.length ? Math.round(trackedAlerts.reduce((s, a) => s + a.ackRate, 0) / trackedAlerts.length) : 0;

  // Every action below hits the real backend (see
  // backend/src/routes/alertsRoutes.js) and replaces the local alert with
  // whatever the server actually persisted — no optimistic local-only
  // mutation, so the UI can never drift from the source of truth. The
  // server re-checks the same capability (requireCapability) regardless of
  // what this page shows, so a stale/forged UI state can't force an action
  // through.
  async function runAction(id, serviceCall, label) {
    setActionError(null);
    setPendingId(id);
    try {
      const updated = await serviceCall();
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setActionError(`${label} — ${err.message || 'Une erreur est survenue.'}`);
    } finally {
      setPendingId(null);
    }
  }

  function confirmAlert(id) {
    runAction(id, () => alertsService.confirm(id), 'Confirmation impossible');
  }
  function requestVerification(id) {
    runAction(id, () => alertsService.requestVerification(id), 'Demande de vérification impossible');
  }
  function openReject(id) {
    setRejectTarget(id);
    setRejectReason('');
  }
  async function confirmReject() {
    if (!rejectReason.trim()) return; // motif obligatoire — spec section 11
    const id = rejectTarget;
    setRejectTarget(null);
    await runAction(id, () => alertsService.reject(id, rejectReason.trim()), 'Rejet impossible');
    setRejectReason('');
  }
  function dispatchAlert(id) {
    runAction(id, () => alertsService.dispatch(id), 'Diffusion impossible');
  }
  function fieldEngage(id) {
    runAction(id, () => alertsService.fieldEngage(id), "Engagement de l'équipe impossible");
  }
  function resolveAlert(id) {
    runAction(id, () => alertsService.resolve(id), 'Passage en résolu impossible');
  }
  function closeAlert(id) {
    runAction(id, () => alertsService.close(id), 'Clôture impossible');
  }

  // Several actions can be legal at once (e.g. an ANPC coordinator reviewing
  // a PROPOSED alert can confirm, reject, or ask for field verification) —
  // so this returns an array instead of a single action.
  function getRowActions(a) {
    if (currentRole === 'observateur') return [];
    if (currentRole === 'anpc') {
      if (a.status === 'PROPOSED' || a.status === 'UNDER_REVIEW') {
        return [
          { label: 'Confirmer', variant: 'primary', fn: () => confirmAlert(a.id) },
          ...(a.status === 'PROPOSED' ? [{ label: 'Vérification terrain', variant: 'ghost', fn: () => requestVerification(a.id) }] : []),
          { label: 'Rejeter', variant: 'ghost', fn: () => openReject(a.id) },
        ];
      }
      if (a.status === 'CONFIRMED') return [{ label: 'Diffuser', variant: 'primary', fn: () => dispatchAlert(a.id) }];
      if (a.status === 'RESOLVED') return [{ label: 'Clôturer', variant: 'ghost', fn: () => closeAlert(a.id) }];
      return [];
    }
    if (currentRole === 'pompiers') {
      if (a.status === 'DISPATCHED') return [{ label: 'Engager équipe', variant: 'amber', fn: () => fieldEngage(a.id) }];
      if (a.status === 'ACTIVE') return [{ label: 'Marquer résolu', variant: 'primary', fn: () => resolveAlert(a.id) }];
      return [];
    }
    if (currentRole === 'mairie') return []; // mairie proposes but doesn't action the review steps
    return [];
  }

  function toggleChannel(c) {
    setChannels((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }
  function toggleComposeZone(zn) {
    setComposeZones((prev) => {
      const next = new Set(prev);
      next.has(zn) ? next.delete(zn) : next.add(zn);
      return next;
    });
  }

  // Backend severity has 4 tiers (LOW/MODERATE/HIGH/CRITICAL), the UI only
  // surfaces 3 — HIGH is the ceiling a manually-composed alert can reach.
  const SEVERITY_OF_LEVEL = { low: 'LOW', medium: 'MODERATE', high: 'HIGH' };
  // Backend only persists SMS/PUSH/DASHBOARD (see alertValidators.js) — the
  // UI still offers Sirène/Radio locale as a description of what will
  // physically happen on dispatch, but those aren't tracked channels yet.
  const CHANNEL_OF = { SMS: 'SMS', Push: 'PUSH' };

  async function sendCompose() {
    if (!composeZones.size || composing) return;
    const zonesArr = Array.from(composeZones);
    const zoneIds = zonesArr.map((name) => zones[name]?.id).filter(Boolean);
    if (zoneIds.length !== zonesArr.length) {
      setActionError("Impossible de résoudre l'identifiant d'une ou plusieurs zones sélectionnées.");
      return;
    }
    setActionError(null);
    setComposing(true);
    try {
      const created = await alertsService.create({
        title: `Alerte manuelle — ${zonesArr.join(', ')}`,
        description: message || undefined,
        type: 'Alerte manuelle',
        severity: SEVERITY_OF_LEVEL[worstLevel(zonesArr, zoneRiskGuess)],
        source: 'MANUAL',
        zoneIds,
        channels: Array.from(channels).map((c) => CHANNEL_OF[c]).filter(Boolean),
      });
      setAlerts((prev) => {
        const list = prev ?? [];
        // Defensive dedup — if the realtime 'alert.created' socket event
        // (see useAlerts.js) already upserted this alert by the time this
        // resolves, don't prepend a second copy.
        return list.some((a) => a.id === created.id) ? list : [created, ...list];
      });
      setExpandedId(created.id);
      setComposeZones(new Set());
      setMessage('');
    } catch (err) {
      setActionError(`Proposition impossible — ${err.message || 'Une erreur est survenue.'}`);
    } finally {
      setComposing(false);
    }
  }

  const composeLevel = composeZones.size ? worstLevel(Array.from(composeZones), zoneRiskGuess) : null;
  const rejectTargetAlert = alerts.find((a) => a.id === rejectTarget);

  return (
    <div>
      <TopBar title="Gestion des alertes" />
      <div className="px-7 py-5 flex flex-col gap-4 pb-10">
        {/* Connected user — role comes from the JWT session, no longer switchable here */}
        <Card>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display font-bold text-[12.5px]" style={{ background: r.color }}>
              {r.initials}
            </div>
            <div>
              <div className="text-[12.5px] font-semibold">{r.name}</div>
              <div className="text-[10.5px] text-text-tertiary">{r.label}</div>
            </div>
          </div>
          <div
            className="mt-3 flex items-start gap-2.5 rounded-xl p-3 text-[12.5px] border"
            style={{ background: r.colorSoft, borderColor: r.color }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
            </svg>
            <div>{r.banner}</div>
          </div>
          {actionError && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl p-3 text-[12.5px] border bg-risk-high-soft border-risk-high text-risk-high">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
              </svg>
              <div className="flex-1">{actionError}</div>
              <button onClick={() => setActionError(null)} className="text-risk-high/70 hover:text-risk-high">✕</button>
            </div>
          )}
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <div className="text-xs text-text-secondary font-medium">Alertes actives</div>
            <div className="font-display text-[25px] font-extrabold mt-2">{active}</div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">{high} à risque élevé, {alerts.filter((a) => ['DISPATCHED', 'ACTIVE'].includes(a.status)).length} en cours de traitement</div>
          </Card>
          <Card>
            <div className="text-xs text-text-secondary font-medium">En attente d'examen</div>
            <div className="font-display text-[25px] font-extrabold mt-2">{awaitingReview.length}</div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">{awaitingReview.length ? `Ex. — ${awaitingReview[0].zones.join(', ')}` : 'Aucune alerte en attente'}</div>
          </Card>
          <Card>
            <div className="text-xs text-text-secondary font-medium">Taux moyen d'accusé réception</div>
            <div className="font-display text-[25px] font-extrabold mt-2">{avgAck}%</div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">Sur les alertes diffusées</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
          {/* Alerts table */}
          <Card
            title="Toutes les alertes"
            right={
              <div className="flex gap-2 flex-wrap items-center">
                <DataSourceBadge source={source} loading={loading} />
                <input placeholder="Rechercher un quartier..." value={search} onChange={(e) => setSearch(e.target.value)}
                       className="border border-border rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-brand w-[160px]" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-[12px] outline-none">
                  <option value="all">Tous statuts</option>
                  {Object.entries(statusMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-[12px] outline-none">
                  <option value="all">Tous risques</option>
                  <option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Élevé</option>
                </select>
              </div>
            }
          >
            {filtered.length === 0 ? (
              <div className="text-center text-text-tertiary text-[12px] py-8">Aucune alerte ne correspond à ces filtres.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((a) => {
                  const sm = statusMeta[a.status];
                  const rowActions = getRowActions(a);
                  const isOpen = expandedId === a.id;
                  return (
                    <div key={a.id} className="border border-border-soft rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedId(isOpen ? null : a.id)}
                        className="w-full flex flex-wrap items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-alt"
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-[12.5px] min-w-[110px]">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={riskColor[a.level]} strokeWidth="2.2">
                            <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.2" />
                          </svg>
                          {a.zones.length > 1 ? `${a.zones[0]} +${a.zones.length - 1}` : a.zones[0]}
                        </span>
                        <RiskBadge level={a.level} />
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: sm.soft, color: sm.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }} />{sm.label}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11.5px] text-text-secondary">
                          <span className="w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ background: roleColorOf[a.proposerRole] }}>{a.proposerInitials}</span>
                          {a.proposer} · {roleLabelOf[a.proposerRole]}
                        </span>
                        <span className="text-[11.5px] text-text-tertiary ml-auto">{a.time}</span>
                        {rowActions.length > 0 && (
                          <span className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {rowActions.map((action) => (
                              <span key={action.label} onClick={pendingId === a.id ? undefined : action.fn}>
                                <Btn variant={action.variant} className={pendingId === a.id ? 'opacity-50 pointer-events-none' : ''}>
                                  {pendingId === a.id ? '…' : action.label}
                                </Btn>
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-4 pt-1 border-t border-border-soft bg-surface-alt/40">
                          <div className="flex flex-wrap gap-4 text-[11.5px] text-text-secondary mb-3">
                            <div>Zones <b className="text-text-primary">{a.zones.join(', ')}</b></div>
                            <div>Canaux <b className="text-text-primary">{a.channels.length ? a.channels.join(', ') : '—'}</b></div>
                            <div>Audience <b className="text-text-primary">{a.audience}</b></div>
                            <div>Taux d'accusé réception <b className="text-text-primary">{a.ackRate}%</b></div>
                          </div>
                          {a.rejectionReason && (
                            <div className="mb-3 text-[11.5px] bg-risk-high-soft text-risk-high rounded-lg px-3 py-2">
                              <b>Motif de rejet :</b> {a.rejectionReason}
                            </div>
                          )}
                          {/* Chronological timeline — spec section 12 (append-only AlertEvent log) */}
                          <div className="flex flex-col gap-2.5">
                            {a.events.map((ev, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-brand text-white mt-0.5">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M20 6L9 17l-5-5" /></svg>
                                </div>
                                <div className="flex-1 flex flex-wrap justify-between text-[12px]">
                                  <span className="font-semibold">{ev.label}</span>
                                  <span className="text-text-secondary">{ev.actor}</span>
                                  <span className="text-text-tertiary">{ev.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Compose panel */}
          <Card title="Nouvelle alerte" subtitle="Toute alerte proposée doit être examinée par un coordinateur ANPC avant diffusion">
            {currentRole === 'observateur' && (
              <div className="flex items-start gap-2.5 text-[12.5px] text-text-secondary bg-surface-alt rounded-xl p-3.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 flex-shrink-0"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 118 0v3" /></svg>
                <div>Votre rôle est en lecture seule.<br />La création d'alertes n'est pas disponible.</div>
              </div>
            )}
            {currentRole === 'pompiers' && (
              <div className="flex items-start gap-2.5 text-[12.5px] text-text-secondary bg-surface-alt rounded-xl p-3.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 flex-shrink-0"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
                <div>Les Sapeurs-Pompiers ne créent pas d'alertes.<br />Utilisez les actions sur les alertes diffusées pour engager votre équipe ou marquer une situation résolue.</div>
              </div>
            )}
            {(currentRole === 'anpc' || currentRole === 'mairie') && (
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Zones concernées (une alerte peut couvrir plusieurs quartiers)</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto border border-border-soft rounded-lg p-2">
                    {allZoneNames.map((zn) => (
                      <label key={zn} className={`px-2.5 py-1.5 rounded-full text-[11.5px] border cursor-pointer ${composeZones.has(zn) ? 'bg-brand-soft border-brand text-brand font-semibold' : 'border-border text-text-secondary'}`}>
                        <input type="checkbox" className="hidden" checked={composeZones.has(zn)} onChange={() => toggleComposeZone(zn)} />
                        {zn}
                      </label>
                    ))}
                  </div>
                  {composeLevel && (
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-text-tertiary">
                      <RiskBadge level={composeLevel} />
                      Niveau de risque le plus élevé parmi les zones sélectionnées
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Message</label>
                  <textarea
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex. : Risque de crue élevé. Évitez les déplacements non essentiels et suivez les consignes des équipes locales."
                    className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand min-h-[80px] resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Canaux de diffusion</label>
                  <div className="flex flex-wrap gap-2">
                    {['SMS', 'Push', 'Sirène', 'Radio locale'].map((c) => (
                      <label key={c} className={`px-2.5 py-1.5 rounded-full text-[11.5px] border cursor-pointer ${channels.has(c) ? 'bg-brand-soft border-brand text-brand font-semibold' : 'border-border text-text-secondary'}`}>
                        <input type="checkbox" className="hidden" checked={channels.has(c)} onChange={() => toggleChannel(c)} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Audience</label>
                  <div className="flex flex-col gap-1.5">
                    {[['public', 'Grand public'], ['teams', 'Équipes de terrain uniquement'], ['both', 'Grand public + Équipes']].map(([v, l]) => (
                      <label key={v} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] border cursor-pointer ${audience === v ? 'bg-brand-soft border-brand' : 'border-border-soft'}`}>
                        <input type="radio" name="aud" checked={audience === v} onChange={() => setAudience(v)} />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
                <Btn variant="amber" onClick={sendCompose} className="text-center py-2.5" disabled={!composeZones.size || composing}>
                  {composing ? 'Envoi…' : "Proposer l'alerte"}
                </Btn>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rejection modal — reason is mandatory (spec section 11) */}
      {rejectTarget !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setRejectTarget(null)}>
          <div className="bg-surface rounded-xl2 shadow-card max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold mb-1">Rejeter l'alerte</div>
            <div className="text-[11.5px] text-text-tertiary mb-3">
              {rejectTargetAlert?.zones.join(', ')} — un motif est obligatoire, l'alerte ne sera jamais supprimée silencieusement.
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex. : Risque retombé sous le seuil de vigilance après réévaluation météo."
              autoFocus
              className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand min-h-[90px] resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <Btn variant="ghost" onClick={() => setRejectTarget(null)}>Annuler</Btn>
              <Btn variant="primary" onClick={confirmReject} disabled={!rejectReason.trim()}>Confirmer le rejet</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

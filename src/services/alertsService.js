import { apiFetch } from '../api/client';

// Backend shape (see backend/src/controllers/alertsController.js serialize()):
//   { id, title, type, severity: 'LOW'|'MODERATE'|'HIGH'|'CRITICAL',
//     status, source: 'PREDICTION'|'MANUAL', zones: [{id, name}],
//     proposer, proposerRole: 'CIVIL_PROTECTION'|'AUTHORITY'|'EMERGENCY_SERVICE',
//     createdAt, rejectionReason, events: [{label, actor, role, time}] }
//
// Frontend contract (see src/data/alerts.js — used by Dashboard/Alerts/RiskMap):
//   { id, zones: string[], level: 'low'|'medium'|'high', status, source: 'prediction'|'manual',
//     proposer, proposerInitials, proposerRole: 'anpc'|'mairie'|'pompiers'|'ai',
//     time, channels: string[], audience, ackRate, rejectionReason,
//     events: [{label, actor, role, time}] }
//
// This adapter is the same normalization pattern already used in
// zonesService.js — keeps the rest of the frontend unchanged instead of
// having every page learn the raw backend shape.

const LEVEL_OF_SEVERITY = { LOW: 'low', MODERATE: 'medium', HIGH: 'high', CRITICAL: 'high' };
const SOURCE_OF = { PREDICTION: 'prediction', MANUAL: 'manual' };
const ORG_KEY_OF_ROLE = { CIVIL_PROTECTION: 'anpc', AUTHORITY: 'mairie', EMERGENCY_SERVICE: 'pompiers' };

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const hhmm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return hhmm;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Hier, ${hhmm}`;
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}, ${hhmm}`;
}

function adaptEvent(e) {
  return {
    label: e.label,
    actor: e.actor,
    role: e.role === 'SYSTEM' ? 'ai' : ORG_KEY_OF_ROLE[e.role] || 'anpc',
    time: formatTime(e.time),
  };
}

export function adaptAlert(raw) {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    level: LEVEL_OF_SEVERITY[raw.severity] || 'medium',
    status: raw.status,
    source: SOURCE_OF[raw.source] || 'manual',
    zones: (raw.zones || []).map((z) => (typeof z === 'string' ? z : z.name)),
    proposer: raw.proposer || 'Système',
    proposerInitials: initialsOf(raw.proposer),
    proposerRole: ORG_KEY_OF_ROLE[raw.proposerRole] || 'anpc',
    time: formatTime(raw.createdAt),
    // Not modeled in the backend yet (see backend/prisma/schema.prisma —
    // Alert has no channels/audience/ackRate fields). Left as honest empty
    // defaults rather than fabricated numbers, per this project's rule of
    // never presenting invented data as real (spec section 33).
    channels: raw.channels || [],
    audience: raw.audience || 'Non défini',
    ackRate: raw.ackRate ?? 0,
    rejectionReason: raw.rejectionReason,
    events: (raw.events || []).map(adaptEvent),
  };
}

export const alertsService = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const rows = await apiFetch(`/alerts${qs ? `?${qs}` : ''}`);
    return rows.map(adaptAlert);
  },
  get: async (id) => adaptAlert(await apiFetch(`/alerts/${id}`)),
  getTimeline: (id) => apiFetch(`/alerts/${id}/timeline`),
  create: async (payload) => adaptAlert(await apiFetch('/alerts', { method: 'POST', body: JSON.stringify(payload) })),
  confirm: async (id) => adaptAlert(await apiFetch(`/alerts/${id}/confirm`, { method: 'POST' })),
  // reason is mandatory — spec section 11 ("obliger la saisie d'un motif").
  reject: async (id, reason) =>
    adaptAlert(await apiFetch(`/alerts/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })),
  requestVerification: async (id) => adaptAlert(await apiFetch(`/alerts/${id}/request-verification`, { method: 'POST' })),
  dispatch: async (id) => adaptAlert(await apiFetch(`/alerts/${id}/dispatch`, { method: 'POST' })),
  fieldEngage: async (id) => adaptAlert(await apiFetch(`/alerts/${id}/field-engage`, { method: 'POST' })),
  resolve: async (id) => adaptAlert(await apiFetch(`/alerts/${id}/resolve`, { method: 'POST' })),
  close: async (id) => adaptAlert(await apiFetch(`/alerts/${id}/close`, { method: 'POST' })),
};
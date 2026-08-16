import { apiFetch } from '../api/client';

// Backend shape (see backend/src/controllers/incidentsController.js):
//   { id, type, description, latitude, longitude, zoneId, status: 'PENDING'|'CONFIRMED'|'REJECTED'|'VERIFYING',
//     confidence, createdAt, verifiedAt, verifiedById, reportedById,
//     zone: { name } | null, reportedBy: { name } | null,
//     media: [{ id, type, url, verificationStatus }] }
//
// Frontend contract (used by IncidentReports.jsx):
//   { id, type, description, status, zoneName, reporterName, latitude, longitude,
//     time, media: [{id, type, url}] }
//
// Same normalization pattern as alertsService.js — keeps page code shielded
// from the raw backend shape.

export const statusMeta = {
  PENDING: { label: 'En attente', color: '#EF8F1E', soft: '#FDF1DE' },
  VERIFYING: { label: 'En vérification', color: '#6C5CE7', soft: '#EFEBFD' },
  CONFIRMED: { label: 'Confirmé', color: '#1E9E5A', soft: '#E6F7EC' },
  REJECTED: { label: 'Rejeté', color: '#DC3B3B', soft: '#FCE7E7' },
};

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const hhmm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `Aujourd'hui, ${hhmm}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Hier, ${hhmm}`;
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}, ${hhmm}`;
}

export function adaptIncident(raw) {
  return {
    id: raw.id,
    type: raw.type,
    description: raw.description || '',
    status: raw.status || 'PENDING',
    zoneId: raw.zoneId || null,
    zoneName: raw.zone?.name || 'Zone non résolue',
    reporterName: raw.reportedBy?.name || 'Anonyme',
    latitude: raw.latitude,
    longitude: raw.longitude,
    createdAt: raw.createdAt,
    time: formatTime(raw.createdAt),
    verifiedAt: raw.verifiedAt,
    media: (raw.media || []).map((m) => ({ id: m.id, type: m.type, url: m.url })),
  };
}

export const incidentsService = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const rows = await apiFetch(`/incidents${qs ? `?${qs}` : ''}`);
    return rows.map(adaptIncident);
  },
  // decision: 'CONFIRMED' | 'REJECTED' | 'VERIFYING'
  verify: async (id, decision) =>
    adaptIncident(await apiFetch(`/incidents/${id}/verify`, { method: 'POST', body: JSON.stringify({ decision }) })),
};
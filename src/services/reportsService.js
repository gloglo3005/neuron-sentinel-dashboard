import { apiFetch } from '../api/client';

// GET /api/reports returns resolved/closed Alert rows, each with its zones,
// timeline and validating user attached (see
// backend/src/controllers/reportsController.js) — a different concept than
// the frontend's downloadable-file list, since PDF/CSV generation isn't
// implemented server-side yet. Each resolved alert is adapted into a
// one-line incident report summary below.
//
// monthlyTrend (alert count per month, for the bar chart) has no backend
// aggregate endpoint yet, so it comes back empty rather than reusing the
// bundled mock numbers under a "REAL DATA" badge.

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : '';
}

function adaptReport(alert) {
  const zoneNames = (alert.zones || []).map((z) => z.zone?.name).filter(Boolean);
  const end = alert.resolvedAt || alert.closedAt || alert.createdAt;
  return {
    id: alert.id,
    title: `Rapport d'incident — ${alert.title}`,
    type: 'incident',
    period: `${formatDate(alert.createdAt)}${end ? ` – ${formatDate(end)}` : ''}`,
    zones: zoneNames.length ? zoneNames.join(', ') : 'Non précisé',
    by: alert.validatedBy?.name || alert.createdBy?.name || 'Système',
    date: formatDate(end),
    size: '—', // no file is actually generated server-side yet
    format: 'PDF',
  };
}

export const reportsService = {
  async list() {
    const rows = await apiFetch('/reports');
    return {
      reports: rows.map(adaptReport),
      // See comment above — no backend aggregate endpoint yet.
      monthlyTrend: { months: [], values: [] },
    };
  },
  create: (payload) => apiFetch('/reports', { method: 'POST', body: JSON.stringify(payload) }),
};
import { apiFetch } from '../api/client';

// Backend GET /api/predictions?zoneId=&horizon= returns Prediction rows
// with factors: [{factor, value, contribution}] (see
// backend/src/controllers/predictionsController.js). The frontend's
// zoneExplain waterfall wants one row per zone:
//   { risk, confidence, base, rain, drain, hist, urban, proximity }
// The backend only tracks 4 factors (base/rainfall/drainage/history) —
// urban/proximity aren't modeled there, so they default to 0 rather than
// being invented.
//
// confidenceSeries / accuracySeries / trendDays describe 14 days of model
// performance history. There's no such aggregate endpoint on the backend
// yet (no ModelMetrics table in prisma/schema.prisma), so — rather than
// silently keep showing the bundled mock numbers under a "REAL DATA"
// badge — these come back empty until that endpoint exists. The chart
// section will show blank instead of a fabricated trend.

const FACTOR_KEY = { base: 'base', rainfall: 'rain', drainage: 'drain', history: 'hist' };

function adaptZoneExplain(rows) {
  // One row per zone — prefer horizon=6 (matches how the seed data was
  // authored for zoneExplain), else fall back to the most recent one.
  const byZone = {};
  for (const p of rows) {
    const name = p.zone?.name;
    if (!name) continue;
    const preferred = byZone[name];
    if (!preferred || (p.horizon === 6 && preferred.horizon !== 6)) byZone[name] = p;
  }

  const explain = {};
  for (const [name, p] of Object.entries(byZone)) {
    const entry = {
      predictionId: p.id,
      risk: Math.round(p.probability),
      confidence: Math.round(p.confidence),
      base: 0, rain: 0, drain: 0, hist: 0, urban: 0, proximity: 0,
    };
    for (const f of p.factors || []) {
      const key = FACTOR_KEY[f.factor];
      if (key) entry[key] = Math.round(f.contribution);
    }
    explain[name] = entry;
  }
  return explain;
}

export const predictionsService = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const rows = await apiFetch(`/predictions${qs ? `?${qs}` : ''}`);
    return {
      zoneExplain: adaptZoneExplain(rows),
      // See comment above — no backend equivalent yet.
      trendDays: [],
      confidenceSeries: [],
      accuracySeries: [],
    };
  },
  // POST /api/predictions/generate — runs the AIProvider (MOCK by default,
  // see backend/src/services/aiService.js) for one zone and persists the
  // result (see backend/src/controllers/predictionsController.js). The
  // endpoint already existed server-side; nothing in the dashboard called
  // it yet, so predictions only ever came from the seed data.
  generate: (zoneId, horizon = 6) =>
    apiFetch('/predictions/generate', { method: 'POST', body: JSON.stringify({ zoneId, horizon }) }),
};
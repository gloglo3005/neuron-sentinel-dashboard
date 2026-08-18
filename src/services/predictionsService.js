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
      // The remote model returns factors: [] (see aiService.js) — that's
      // a real "no breakdown available", not a real "every factor is
      // exactly 0". Without this flag the waterfall can't tell the two
      // apart and renders a misleading row of six +0% bars under a
      // 90% final score. Only the local MOCK/fallback scorer ever
      // populates p.factors.
      hasFactors: (p.factors || []).length > 0,
    };
    for (const f of p.factors || []) {
      const key = FACTOR_KEY[f.factor];
      if (key) entry[key] = Math.round(f.contribution);
    }
    explain[name] = entry;
  }
  return explain;
}

// modelVersion is either MODEL_VERSION_MOCK ('MOCK_MODEL_V1') or
// REMOTE_MODEL_VERSION ('NEURON_SENTINEL_REMOTE_v0...') — see
// backend/src/services/aiService.js. Never exposed to the frontend before
// this; used so the "Sources de données" panel can honestly show whether
// predictions are coming from the transparent internal scorer or the
// teammate's real model, instead of a hard-coded, always-"Actif" line for
// a source that was never actually wired up to be checked.
function latestModelSource(rows) {
  const latest = rows.reduce((l, p) => (!l || new Date(p.generatedAt) > new Date(l.generatedAt) ? p : l), null);
  if (!latest) return { modelSource: null, latestGeneratedAt: null };
  return {
    modelSource: String(latest.modelVersion || '').includes('MOCK') ? 'MOCK' : 'REMOTE',
    latestGeneratedAt: latest.generatedAt,
  };
}

export const predictionsService = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const rows = await apiFetch(`/predictions${qs ? `?${qs}` : ''}`);
    const { modelSource, latestGeneratedAt } = latestModelSource(rows);
    return {
      zoneExplain: adaptZoneExplain(rows),
      // See comment above — no backend equivalent yet.
      trendDays: [],
      confidenceSeries: [],
      accuracySeries: [],
      modelSource,
      latestGeneratedAt,
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
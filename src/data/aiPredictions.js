// Bundled demo data — only used when useDataSource()'s hooks fall back to
// mock mode (no backend reachable at all). See src/pages/AIPredictions.jsx
// for how globalFeatures/dataSources are now derived live from whatever
// data is actually loaded, real or mock, rather than shown as a
// hard-coded list regardless of what's really connected.

export const srcStatusMeta = {
  ok: { label: "Actif", color: "#1E9E5A", soft: "#E6F7EC" },
  warn: { label: "À vérifier", color: "#EF8F1E", soft: "#FDF1DE" },
  off: { label: "Inactif", color: "#96A1B3", soft: "#F1F4F9" },
};

// The one line in the old static dataSources list that was already
// honest — Sentinel Hub isn't connected anywhere in the backend
// (src/services/satelliteService.js is MOCK-only regardless of
// SATELLITE_API_KEY), and this said so plainly. Kept as-is, appended
// after whatever's actually live.
export const plannedDataSources = [
  { name: "Imagerie satellite — Sentinel Hub", meta: "Amélioration future (non prioritaire)", sync: "non connecté", status: "off" },
];

// baseline + signed contributions sum to the zone's current risk score
// NOTE: unlike the live backend (both the internal MOCK scorer and the
// remote model — see aiService.js), this bundled fallback still invents
// nonzero urban/proximity numbers. Neither real code path ever computes
// those two factors. Left as-is here (only reached when no backend is
// reachable at all, already flagged by the MOCK badge) rather than
// rebalanced, since zeroing them would require re-deriving every zone's
// additive total by hand.
export const zoneExplain = {
  "Baguida": { risk: 84, confidence: 88, base: 20, rain: 28, drain: 16, hist: 12, urban: 5, proximity: 3 },
  "Kodjoviakopé": { risk: 81, confidence: 90, base: 20, rain: 26, drain: 14, hist: 15, urban: 4, proximity: 2 },
  "Djidjolé": { risk: 58, confidence: 86, base: 20, rain: 15, drain: 4, hist: 9, urban: 5, proximity: 5 },
  "Amoutivé": { risk: 55, confidence: 87, base: 20, rain: 16, drain: 3, hist: 8, urban: 4, proximity: 4 },
  "Bè": { risk: 22, confidence: 94, base: 20, rain: 3, drain: -4, hist: 1, urban: 1, proximity: 1 },
  "Agoè": { risk: 20, confidence: 95, base: 20, rain: 2, drain: -5, hist: 1, urban: 1, proximity: 1 },
  "Tokoin": { risk: 18, confidence: 96, base: 20, rain: 1, drain: -6, hist: 0, urban: 2, proximity: 1 },
  "Adidogomé": { risk: 15, confidence: 97, base: 20, rain: 2, drain: -8, hist: -1, urban: 1, proximity: 1 },
};

export const featureLabels = {
  base: "Base de référence", rain: "Pluviométrie", drain: "Capacité de drainage",
  hist: "Historique des crues", urban: "Densité urbaine", proximity: "Proximité cours d'eau",
};

export const trendDays = Array.from({ length: 14 }, (_, i) => `J-${13 - i}`);
export const confidenceSeries = [86, 87, 88, 86, 89, 90, 88, 91, 92, 90, 93, 91, 92, 91];
export const accuracySeries = [82, 83, 85, 84, 86, 87, 85, 88, 89, 87, 90, 88, 89, 89];
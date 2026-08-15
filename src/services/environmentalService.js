import { apiFetch } from '../api/client';

// GET /api/environmental-data returns raw EnvironmentalData rows — one per
// zone per reading: { zoneId, zone, source, timestamp, rainfall,
// temperature, humidity, windSpeed }. The frontend wants several distinct
// shapes the backend doesn't fully cover yet:
//  - observedRain: built below from real readings, averaged per hour
//    across zones (closest real equivalent to a "citywide" curve).
//  - envZones: rain/drain/hist come from GET /api/zones (Zone.rainScore /
//    drainScore / historyScore are real columns) — soil type and
//    distance-to-river aren't modeled anywhere server-side, so those two
//    columns are left blank rather than invented.
//  - forecastRain / forecast5 / dataFeeds: no backend endpoint exists for
//    these — they need a real WeatherProvider integration (see
//    backend/src/services/weatherService.js, MOCK by default while
//    WEATHER_API_KEY is unset). Left empty rather than shown as fabricated
//    "REAL DATA".

function hourKey(iso) {
  const d = new Date(iso);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function buildObservedRain(rows) {
  const byHour = new Map();
  for (const r of rows) {
    const k = hourKey(r.timestamp);
    if (!byHour.has(k)) byHour.set(k, []);
    byHour.get(k).push(r.rainfall ?? 0);
  }
  return [...byHour.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, values]) => Math.round(values.reduce((s, v) => s + v, 0) / values.length));
}

function buildEnvZones(envRows, zoneRows) {
  const latestByZone = {};
  for (const r of envRows) {
    const name = r.zone?.name;
    if (!name) continue;
    if (!latestByZone[name] || new Date(r.timestamp) > new Date(latestByZone[name].timestamp)) {
      latestByZone[name] = r;
    }
  }
  return zoneRows.map((z) => ({
    name: z.name,
    rain: Math.round(latestByZone[z.name]?.rainfall ?? z.rainScore ?? 0),
    drain: Math.round(z.drainScore ?? 0),
    hist: Math.round(z.historyScore ?? 0),
    soil: null,
    river: null,
  }));
}

export const environmentalService = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const [envRows, zoneRows] = await Promise.all([
      apiFetch(`/environmental-data${qs ? `?${qs}` : ''}`),
      apiFetch('/zones'),
    ]);
    return {
      observedRain: buildObservedRain(envRows),
      forecastRain: [],
      forecast5: [],
      envZones: buildEnvZones(envRows, zoneRows),
      dataFeeds: [],
    };
  },
  // POST /api/environmental-data/sync — pulls one fresh reading per zone
  // from the configured WeatherProvider (real OpenWeatherMap, or MOCK if
  // WEATHER_API_KEY isn't set server-side — see backend/src/services/weatherService.js).
  sync: () => apiFetch('/environmental-data/sync', { method: 'POST' }),
};
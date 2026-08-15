import { apiFetch } from '../api/client';

// Expected backend shape (see spec section 26): GET /api/zones returns an
// array of { id, name, lat, lng, population, drainScore, historyScore,
// rainScore, riskSeries: number[], radius }. We normalize it here into the
// { [name]: {...} } shape the existing ZoneMap/pages already use, so the
// rest of the frontend doesn't need to change again once the API is live.
export const zonesService = {
  async list() {
    const rows = await apiFetch('/zones');
    const zones = {};
    for (const z of rows) {
      zones[z.name] = {
        id: z.id,
        lat: z.lat,
        lng: z.lng,
        pop: z.population,
        drain: z.drainScore,
        hist: z.historyScore,
        rain: z.rainScore,
        series: z.riskSeries,
        radius: z.radius,
      };
    }
    return { zones, zoneNames: Object.keys(zones) };
  },
  get(id) {
    return apiFetch(`/zones/${encodeURIComponent(id)}`);
  },
  getPredictions(id) {
    return apiFetch(`/zones/${encodeURIComponent(id)}/predictions`);
  },
};
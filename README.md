# Neuron Sentinel — Authority Dashboard

Web dashboard for flood risk monitoring and early warning in Lomé (Togo), built with **React**,
**Tailwind CSS**, and **Leaflet.js**. This is the interface used by authorities (ANPC, Mairie,
GNSP / fire department) — not the public-facing app (see `../citizen-pwa`).

## Requirements

- Node.js 18+ and npm
- Internet access on first load: Google Fonts, OpenStreetMap map tiles, and the Leaflet CSS are
  loaded from a CDN (see `index.html`). Without a connection, the map and fonts won't render
  correctly.

## Tech stack

- **React 18** + **Vite** — fast dev server, HMR
- **React Router** — navigation across the 6 modules
- **Tailwind CSS** — design system (colors, Manrope/Inter typography from the mockups)
- **Leaflet.js** (`react-leaflet`) — real interactive map of Lomé with geolocated monitored
  neighbourhoods (quartiers)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

For a production build:

```bash
npm run build
npm run preview
```

## Environment variables

Only one variable, in `.env` (see `.env.example`):

```env
VITE_API_BASE_URL=
```

Leave it empty during frontend-only development — every page keeps working from bundled mock
data (see below). Once the backend (`../backend`) is running, set it to e.g.
`http://localhost:4000/api`.

## Project structure

```
src/
  api/
    client.js        → fetch wrapper for the backend (apiFetch), handles auth headers + errors
  services/           → one module per business domain, one call = one REST endpoint
    zonesService.js
    alertsService.js
    predictionsService.js
    environmentalService.js
    reportsService.js
    authService.js
  hooks/
    useDataSource.js  → generic "real API -> fallback to mocks" hook (see below)
    useZones.js
    useAlerts.js
    usePredictions.js
    useEnvironmentalData.js
    useReports.js
  context/
    AuthContext.jsx   → real JWT session (login/me/logout against the backend)
  data/               → bundled demo data (zones, alerts, reports, AI, environment) — only
                        imported by the hooks as a fallback, never directly by pages
  components/         → TopNav, ZoneMap (Leaflet), UI atoms (incl. DataSourceBadge), SVG charts
  pages/
    Login.jsx
    Dashboard.jsx
    RiskMap.jsx
    Alerts.jsx
    AIPredictions.jsx
    EnvironmentalData.jsx
    Reports.jsx
```

### API / mock data architecture

Each page calls a hook (`useZones()`, `useAlerts()`, etc.) instead of importing `src/data/*`
directly. The hook tries the real API through `services/`, and if the backend isn't configured
or isn't reachable, falls back automatically to the bundled demo data — without ever crashing
the page.

```
Page  →  hook (useZones, useAlerts, ...)  →  service (zonesService.list(), ...)  →  apiFetch()
                     │                                                                   │
                     └───────────────── automatic fallback on failure ─────────────  VITE_API_BASE_URL
                                        (data from src/data/)
```

Each hook exposes `source: 'real' | 'mock'`, surfaced through the `<DataSourceBadge />` component
(a **MOCK** / **REAL DATA** badge visible on every page) — demo data must never be presented as if
it were real.

Note: `zonesService.list()` expects a backend payload shaped like
`{ id, name, lat, lng, population, drainScore, historyScore, rainScore, riskSeries, radius }[]`
and converts it to the shape the frontend uses.

### Authentication

`Login.jsx` + `AuthContext` run a real JWT flow against `POST /api/auth/login` on the backend
(account lockout after repeated failures, dashboard-role restriction, audit log — see
`backend/src/controllers/authController.js`). There is **no** hardcoded dev user — a running
backend is required to log in. For local testing, run `npm run seed` in `../backend`: it creates
demo accounts (ANPC, Mairie, GNSP, read-only observer) and prints their credentials to the
console.

## Modules

1. **Dashboard** — overview: KPIs, risk map, weather forecast, AI explainability, active alerts
2. **Risk Map** — interactive Leaflet map with time horizons (Now → +48h), layers (population),
   search, per-neighbourhood detail panel
3. **Alerts** — multi-actor alert workflow (ANPC, Mairie, Fire dept, Observer) with role-based
   permissions and a step-by-step timeline
4. **AI Predictions** — model explainability: feature importance, per-zone waterfall breakdown,
   confidence, model version history
5. **Environmental Data** — observed/forecast rainfall, 5-day forecast, per-zone data, IoT
   sensors (planned), feed status
6. **Reports** — report generation and history, monthly alert trend

## Notes on data

As long as `VITE_API_BASE_URL` is unset (or the backend is unreachable), all data (risk, alerts,
sensors, reports) comes from the **bundled demo data** in `src/data/`, served through the
`hooks/` layer. The **MOCK** badge on every page makes this explicit.

Lomé neighbourhood coordinates (`src/data/zones.js`) are approximate positions for demo mapping
purposes — to be refined with real geographic data (administrative boundary GeoJSON) for
production use.

## Known gaps

- **Alert statuses not fully migrated** — `src/data/alerts.js` still uses the prototype status
  set (`draft/pending/sent/ack/resolved`) rather than the target workflow
  (`PROPOSED → ... → CLOSED`) used by the real backend
- **No real neighbourhood boundaries in the mock data path** — the map uses circles positioned
  on approximate coordinates rather than official GeoJSON polygons (the backend can sync real
  OpenStreetMap boundaries via `POST /api/zones/sync-geometry` once connected)
- **`zonesService.list()`'s expected API shape** should be double-checked against the live
  backend response as the schema evolves
- **"Download" / "View" buttons (Reports)** and a few other actions still trigger a demo
  `alert()` rather than generating a real file
- Verified via `npm run build` in this environment (all routes resolve), but not manually
  clicked through in a real browser — a first `npm run dev` run on your side is recommended

## Suggested next steps

1. Confirm `VITE_API_BASE_URL` points at a running backend and remove any remaining mock-shaped
   assumptions in `services/*`
2. Migrate alert statuses to the full `PROPOSED → ... → CLOSED` workflow once fully wired to
   `/api/alerts`
3. Replace the map's placeholder circles with real GeoJSON polygons (`POST /api/zones/sync-geometry`)
4. Wire real PDF/CSV report generation
5. Deployment (Vercel, Netlify, or other)
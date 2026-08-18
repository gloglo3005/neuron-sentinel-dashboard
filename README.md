# Neuron Sentinel — Citizen PWA

Installable mobile web app for Lomé residents: local weather, flood risk level, official
alerts, and hazard reporting for their neighbourhood.

Talks to the **same backend** as the authority dashboard (`../backend`), through the
`/api/citizen/*` routes only. No direct calls to OpenWeather/OSM — everything goes through the
backend.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:5174` (a different port from the dashboard, which uses 5173, so both
can run at once). The backend must be running on `http://localhost:4000` (or adjust
`VITE_API_BASE_URL`).

For a production build:

```bash
npm run build
npm run preview
```

## Environment variables

```env
VITE_API_BASE_URL="http://localhost:4000/api"
```

## Tech stack

- **React 19** + **Vite**
- **React Router** — auth-gated routing (see `src/App.jsx`)
- **Tailwind CSS**
- A minimal offline layer (`src/offline/lastKnown.js`) + a service worker for app-shell caching

## Project structure

```
src/
  api/
    client.js              → fetch wrapper, token storage, error handling
  services/
    citizenService.js      → one call = one /api/citizen/* endpoint
  context/
    AuthContext.jsx         → citizen session (register/login/me), separate from the
                               dashboard's AuthContext — different token scope, different roles
  hooks/
    useGeolocation.js
  offline/
    lastKnown.js            → caches the last successful "current zone" response so the home
                               screen can still show something (with a timestamp) when offline
  components/
    BottomNav.jsx
    ui.jsx
  pages/
    Login.jsx
    Register.jsx
    OnboardingLocation.jsx  → one-time GPS permission + zone resolution
    Home.jsx                → zone, weather, risk, active alert (spec: everything a citizen
                               needs, nothing they don't — no raw AI internals, no admin fields)
    Alerts.jsx
    Report.jsx
    Profile.jsx
```

Public routes: `/login`, `/register`. Everything else requires an active citizen session
(enforced client-side in `App.jsx`, and server-side by `requireCitizenAccess` on the backend —
the client-side gate is a UX nicety, not the real boundary).

## Installing as an app (PWA)

On mobile (Chrome/Safari), open the URL then "Add to Home Screen". The manifest and service
worker are already configured (`public/manifest.json`, `public/sw.js`) with the Neuron Sentinel
icon set (`public/icons/`).

## What's done / not done

- ✅ Citizen registration/login (phone + password, no SMS/OTP)
- ✅ One-time geolocation → zone resolution on the backend
- ✅ Home screen: zone, weather, risk, active alert
- ✅ Zone alert history
- ✅ Hazard reporting (type + description + GPS)
- ✅ Cached app shell (opens offline), last-known zone data shown with a timestamp when the
  network is unavailable
- ❌ Push notifications — not wired up (would need VAPID keys + a stored subscription; out of
  scope for this pass)
- ❌ Photo upload on a report — the `media` field exists on the API (`IncidentMedia`) but there's
  no file input in the UI yet

## Known gaps

- No password reset flow (matches the backend: registration/login only, no OTP verification of
  the phone number)
- `useGeolocation.js` requests location once during onboarding; there's no way yet to
  re-trigger it later if the citizen moves to a different neighbourhood (would need a "update my
  location" action, e.g. in `Profile.jsx`, calling `POST /api/citizen/location` again)
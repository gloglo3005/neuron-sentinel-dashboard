export const observedRain = [1,0,0,2,4,6,5,3,2,1,0,0,1,3,5,8,9,7,5,3,2,1,0,1,2,4,7,9,8,6,4,2,1,0,0,1,3,6,8,7,5,3,2,1,0,0,1,2];
export const forecastRain = [3,5,7,9,8,6,4,3,2,1,0,0,1,2,4,6,7,5,3,2,1,0,0,1];

export const forecast5 = [
  { day: "Auj.", type: "rain", desc: "Averses fortes, orages en soirée", temp: "24° / 29°", precip: 82 },
  { day: "Dim.", type: "rain", desc: "Pluies intermittentes", temp: "23° / 28°", precip: 65 },
  { day: "Lun.", type: "cloud", desc: "Nuageux, faibles averses", temp: "23° / 29°", precip: 35 },
  { day: "Mar.", type: "cloud", desc: "Couvert, éclaircies l'après-midi", temp: "24° / 30°", precip: 20 },
  { day: "Mer.", type: "sun", desc: "Ensoleillé, peu de nuages", temp: "25° / 31°", precip: 8 },
];

export const envZones = [
  { name: "Baguida", rain: 61, drain: 35, soil: "Argileux", river: "90 m (côte)", hist: 65 },
  { name: "Kodjoviakopé", rain: 88, drain: 35, soil: "Argileux", river: "120 m (côte)", hist: 75 },
  { name: "Djidjolé", rain: 57, drain: 48, soil: "Argilo-limoneux", river: "800 m", hist: 44 },
  { name: "Amoutivé", rain: 60, drain: 50, soil: "Limoneux", river: "600 m", hist: 40 },
  { name: "Agoè", rain: 33, drain: 75, soil: "Sableux", river: "1.8 km", hist: 22 },
  { name: "Bè", rain: 38, drain: 70, soil: "Sableux", river: "450 m (lagune)", hist: 20 },
  { name: "Tokoin", rain: 30, drain: 80, soil: "Sableux", river: "1.2 km", hist: 15 },
  { name: "Adidogomé", rain: 25, drain: 85, soil: "Sableux", river: "2.1 km", hist: 10 },
];

export const plannedSensors = [
  "Baguida — Embouchure Est", "Kodjoviakopé — Front de mer", "Djidjolé — Canal principal",
  "Amoutivé — Marché central", "Bè — Lagune Nord", "Agoè — Zone industrielle",
  "Tokoin — Carrefour Hôpital", "Adidogomé — Voie de contournement",
];

// Bundled demo data — only used when useEnvironmentalData() falls back to
// mock mode (no backend reachable at all). See src/pages/EnvironmentalData.jsx
// for how the "État des flux de données" card is now built live instead of
// from a hard-coded list — "WeatherAPI / Tomorrow.io" had no backend
// integration at all and was removed rather than kept as a fake "Actif" line.
export const dataFeeds = [
  { name: "OpenWeatherMap", meta: "Prévisions météo — mode MOCK (démo hors ligne)", sync: "démo", status: "warn" },
  { name: "Nominatim (OSM)", meta: "Géocodage des zones de Lomé", sync: "à la demande", status: "ok" },
  { name: "Sentinel Hub — satellite", meta: "Amélioration future, non prioritaire", sync: "non connecté", status: "off" },
];

export function drainColor(v) {
  return v >= 70 ? "#1E9E5A" : v >= 50 ? "#EF8F1E" : "#DC3B3B";
}
export function drainSoft(v) {
  return v >= 70 ? "#E6F7EC" : v >= 50 ? "#FDF1DE" : "#FCE7E7";
}
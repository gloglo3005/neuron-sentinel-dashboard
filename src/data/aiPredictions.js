export const globalFeatures = [
  { label: "Pluviométrie", val: 34 },
  { label: "Capacité de drainage", val: 24 },
  { label: "Historique des crues", val: 18 },
  { label: "Densité urbaine", val: 10 },
  { label: "Proximité cours d'eau", val: 8 },
  { label: "Type de sol", val: 6 },
];

export const dataSources = [
  { name: "OpenWeather API", meta: "Prévisions météo générales", sync: "il y a 4 min", status: "ok" },
  { name: "WeatherAPI / Tomorrow.io", meta: "Pluviométrie de précision", sync: "il y a 12 min", status: "ok" },
  { name: "Historique des crues — ANPC", meta: "Registre 2021–2026", sync: "hier, 22:00", status: "ok" },
  { name: "Cadastre & drainage municipal", meta: "Capacité des réseaux d'évacuation", sync: "il y a 3 jours", status: "warn" },
  { name: "Imagerie satellite — Sentinel Hub", meta: "Amélioration future (non prioritaire)", sync: "non connecté", status: "off" },
];

export const srcStatusMeta = {
  ok: { label: "Actif", color: "#1E9E5A", soft: "#E6F7EC" },
  warn: { label: "À vérifier", color: "#EF8F1E", soft: "#FDF1DE" },
  off: { label: "Inactif", color: "#96A1B3", soft: "#F1F4F9" },
};

// baseline + signed contributions sum to the zone's current risk score
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

export const modelVersions = [
  { v: "v3.2", date: "Aujourd'hui, 16:40", current: true, desc: "Ré-entraînement quotidien avec les 24h de données pluviométriques et de drainage les plus récentes. Confiance moyenne +1.2 pt." },
  { v: "v3.1", date: "3 juillet 2026", current: false, desc: "Ajout de la variable « proximité des cours d'eau » et intégration du cadastre de drainage municipal. Réduction des faux positifs en zone côtière." },
  { v: "v3.0", date: "18 juin 2026", current: false, desc: "Passage à un modèle d'ensemble XGBoost + Random Forest (auparavant XGBoost seul). Précision +4 pts sur le jeu de validation." },
  { v: "v2.4", date: "2 mai 2026", current: false, desc: "Premier ré-entraînement avec l'historique complet des crues 2021–2026 fourni par l'ANPC." },
];

// Quartiers de Lomé surveillés par Neuron Sentinel.
// Coordonnées approximatives (centres de quartier) pour l'affichage Leaflet.
// Les scores de risque, drainage, historique etc. sont des données de démonstration.

export const horizons = ["Maintenant", "+6h", "+12h", "+24h", "+48h"];

export const zones = {
  "Bè": {
    lat: 6.1257, lng: 1.2282,
    pop: 12400, drain: 70, hist: 20, rain: 38,
    series: [22, 26, 30, 24, 16],
    radius: 900,
  },
  "Kodjoviakopé": {
    lat: 6.1274, lng: 1.2033,
    pop: 9100, drain: 35, hist: 75, rain: 88,
    series: [81, 88, 92, 85, 60],
    radius: 750,
  },
  "Amoutivé": {
    lat: 6.1354, lng: 1.2197,
    pop: 7300, drain: 50, hist: 40, rain: 60,
    series: [55, 60, 66, 58, 38],
    radius: 700,
  },
  "Tokoin": {
    lat: 6.1508, lng: 1.2191,
    pop: 15600, drain: 80, hist: 15, rain: 30,
    series: [18, 20, 22, 17, 12],
    radius: 1100,
  },
  "Djidjolé": {
    lat: 6.1612, lng: 1.2338,
    pop: 6200, drain: 48, hist: 44, rain: 57,
    series: [58, 64, 70, 62, 40],
    radius: 700,
  },
  "Adidogomé": {
    lat: 6.1782, lng: 1.1987,
    pop: 21000, drain: 85, hist: 10, rain: 25,
    series: [15, 17, 19, 14, 10],
    radius: 1300,
  },
  "Agoè": {
    lat: 6.1873, lng: 1.2158,
    pop: 18400, drain: 75, hist: 22, rain: 33,
    series: [20, 23, 26, 20, 14],
    radius: 1200,
  },
  "Baguida": {
    lat: 6.1452, lng: 1.3341,
    pop: 5800, drain: 35, hist: 65, rain: 61,
    series: [84, 90, 95, 88, 55],
    radius: 800,
  },
};

export const zoneNames = Object.keys(zones);

export function levelOf(v) {
  return v >= 70 ? "high" : v >= 35 ? "medium" : "low";
}

export const riskColor = { low: "#1E9E5A", medium: "#EF8F1E", high: "#DC3B3B" };
export const riskSoft = { low: "#E6F7EC", medium: "#FDF1DE", high: "#FCE7E7" };
export const riskName = { low: "Faible", medium: "Moyen", high: "Élevé" };

export function currentRisk(zoneName, horizonIdx = 0) {
  return zones[zoneName].series[horizonIdx];
}

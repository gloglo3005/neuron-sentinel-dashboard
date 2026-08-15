// Alert workflow reference data.
//
// Status set and permissions match the target workflow:
//   DONNÉES → IA → PRÉDICTION → ALERTE PROPOSÉE → AUTORITÉ → VALIDATION → ALERTE OFFICIELLE → DIFFUSION
// A prediction is NEVER auto-promoted to an official alert — see AIPredictions.jsx's
// "Examiner l'alerte" action, which only creates a PROPOSED alert for an authority to review.

export const roles = {
  anpc: {
    label: "Coordinateur — ANPC", name: "Koffi Adjovi", initials: "KA", color: "#006A4E", colorSoft: "#E3F2ED",
    canPropose: true, canConfirm: true, canReject: true, canRequestVerification: true, canDispatch: true, canClose: true, canFieldUpdate: false,
    banner: "Vous avez l'autorité de confirmation, de diffusion et de clôture des alertes pour l'ensemble des quartiers surveillés. Les alertes proposées par la Mairie ou générées par le modèle IA attendent votre examen avant toute diffusion au public.",
  },
  mairie: {
    label: "Agent — Mairie de Lomé", name: "Ama Séna", initials: "AS", color: "#2E6FDE", colorSoft: "#E7EFFD",
    canPropose: true, canConfirm: false, canReject: false, canRequestVerification: false, canDispatch: false, canClose: false, canFieldUpdate: false,
    banner: "Vous pouvez proposer une alerte pour votre commune, mais elle doit être confirmée par un coordinateur ANPC avant toute diffusion au public.",
  },
  pompiers: {
    label: "Sapeurs-Pompiers — GNSP", name: "Cpt. Edem Kwassi", initials: "EK", color: "#EF8F1E", colorSoft: "#FDF1DE",
    canPropose: false, canConfirm: false, canReject: false, canRequestVerification: false, canDispatch: false, canClose: false, canFieldUpdate: true,
    banner: "Vous ne pouvez pas proposer ni confirmer d'alerte. Utilisez les actions terrain pour signaler l'engagement de votre équipe sur une alerte diffusée, puis la stabilisation de la situation.",
  },
  observateur: {
    label: "Observateur — PNUD/ONG", name: "J. Fernández", initials: "JF", color: "#96A1B3", colorSoft: "#F1F4F9",
    canPropose: false, canConfirm: false, canReject: false, canRequestVerification: false, canDispatch: false, canClose: false, canFieldUpdate: false,
    banner: "Accès en lecture seule. Vous pouvez consulter les alertes et leur chronologie complète, sans possibilité d'action.",
  },
};

// Official 7-status workflow. An alert is never silently deleted — a
// REJECTED alert moves to CLOSED with a mandatory rejectionReason instead.
export const statusMeta = {
  PROPOSED: { label: "Proposée", color: "#6C5CE7", soft: "#EFEBFD" },
  UNDER_REVIEW: { label: "Vérification terrain demandée", color: "#EF8F1E", soft: "#FDF1DE" },
  CONFIRMED: { label: "Confirmée", color: "#2E6FDE", soft: "#E7EFFD" },
  DISPATCHED: { label: "Diffusée", color: "#006A4E", soft: "#E3F2ED" },
  ACTIVE: { label: "Active — équipe engagée", color: "#DC3B3B", soft: "#FCE7E7" },
  RESOLVED: { label: "Résolue", color: "#1E9E5A", soft: "#E6F7EC" },
  CLOSED: { label: "Clôturée", color: "#96A1B3", soft: "#F1F4F9" },
};

// Statuses that still require action from someone before the alert is done.
export const openStatuses = ["PROPOSED", "UNDER_REVIEW", "CONFIRMED", "DISPATCHED", "ACTIVE"];

export const roleColorOf = { anpc: "#006A4E", mairie: "#2E6FDE", pompiers: "#EF8F1E", observateur: "#96A1B3", ai: "#6C5CE7", system: "#6C5CE7" };
export const roleLabelOf = { anpc: "ANPC", mairie: "Mairie", pompiers: "GNSP", observateur: "Observateur", ai: "Modèle IA", system: "Modèle IA" };

// An AlertEvent log entry — see spec section 12. Always appended to, never
// overwritten, so the full history survives every status transition.
function ev(label, actor, role, time) {
  return { label, actor, role, time };
}

export const initialAlerts = [
  {
    id: 1, zones: ["Baguida"], level: "high", status: "ACTIVE",
    type: "Forte pluie / risque d'inondation", source: "prediction",
    proposer: "Système IA", proposerInitials: "AI", proposerRole: "ai",
    time: "21:00", channels: ["SMS", "Push", "Sirène"], audience: "Grand public + Équipes", ackRate: 74,
    rejectionReason: null,
    events: [
      ev("Prédiction générée", "Système IA", "ai", "19:32"),
      ev("Alerte proposée", "Système IA", "ai", "19:40"),
      ev("Alerte confirmée", "Koffi Adjovi", "anpc", "19:52"),
      ev("Diffusée — 3 canal(aux)", "Koffi Adjovi", "anpc", "19:55"),
      ev("Équipe engagée sur le terrain", "Cpt. Edem Kwassi — GNSP", "pompiers", "20:15"),
    ],
  },
  {
    id: 2, zones: ["Kodjoviakopé", "Amoutivé"], level: "high", status: "PROPOSED",
    type: "Forte pluie / risque d'inondation", source: "manual",
    proposer: "Ama Séna", proposerInitials: "AS", proposerRole: "mairie",
    time: "20:10", channels: ["SMS", "Push"], audience: "Grand public + Équipes", ackRate: 0,
    rejectionReason: null,
    events: [
      ev("Alerte proposée (2 quartiers)", "Ama Séna", "mairie", "20:10"),
    ],
  },
  {
    id: 3, zones: ["Djidjolé"], level: "medium", status: "RESOLVED",
    type: "Risque d'inondation modéré", source: "prediction",
    proposer: "Système IA", proposerInitials: "AI", proposerRole: "ai",
    time: "19:15", channels: ["Push"], audience: "Équipes de terrain", ackRate: 100,
    rejectionReason: null,
    events: [
      ev("Prédiction générée", "Système IA", "ai", "19:10"),
      ev("Alerte proposée", "Système IA", "ai", "19:15"),
      ev("Alerte confirmée", "Koffi Adjovi", "anpc", "19:20"),
      ev("Diffusée — 1 canal", "Koffi Adjovi", "anpc", "19:22"),
      ev("Équipe engagée sur le terrain", "Cpt. Edem Kwassi — GNSP", "pompiers", "19:40"),
      ev("Situation stabilisée", "Cpt. Edem Kwassi — GNSP", "pompiers", "20:05"),
    ],
  },
  {
    id: 4, zones: ["Amoutivé"], level: "medium", status: "CLOSED",
    type: "Risque d'inondation modéré", source: "manual",
    proposer: "Koffi Adjovi", proposerInitials: "KA", proposerRole: "anpc",
    time: "Hier, 18:00", channels: ["SMS"], audience: "Grand public", ackRate: 91,
    rejectionReason: null,
    events: [
      ev("Alerte proposée", "Koffi Adjovi", "anpc", "17:50"),
      ev("Alerte confirmée", "Koffi Adjovi", "anpc", "17:52"),
      ev("Diffusée — 1 canal", "Koffi Adjovi", "anpc", "17:55"),
      ev("Équipe engagée sur le terrain", "Cpt. Edem Kwassi — GNSP", "pompiers", "18:20"),
      ev("Situation stabilisée", "Cpt. Edem Kwassi — GNSP", "pompiers", "20:40"),
      ev("Alerte clôturée", "Koffi Adjovi", "anpc", "21:05"),
    ],
  },
  {
    id: 5, zones: ["Tokoin"], level: "low", status: "CLOSED",
    type: "Vigilance pluviométrique", source: "manual",
    proposer: "Ama Séna", proposerInitials: "AS", proposerRole: "mairie",
    time: "17:30", channels: [], audience: "Non défini", ackRate: 0,
    rejectionReason: "Risque retombé sous le seuil de vigilance après réévaluation météo — aucune diffusion nécessaire.",
    events: [
      ev("Alerte proposée", "Ama Séna", "mairie", "17:30"),
      ev("Alerte rejetée", "Koffi Adjovi", "anpc", "17:41"),
    ],
  },
];

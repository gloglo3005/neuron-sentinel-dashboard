export const typeMeta = {
  monthly: { label: "Mensuel", color: "#2E6FDE", soft: "#E7EFFD" },
  incident: { label: "Incident", color: "#DC3B3B", soft: "#FCE7E7" },
  export: { label: "Export", color: "#6C5CE7", soft: "#EFEBFD" },
  planning: { label: "Planification", color: "#EF8F1E", soft: "#FDF1DE" },
};

export const initialReports = [
  { title: "Rapport mensuel — Juillet 2026", type: "monthly", period: "01–31 juil. 2026", zones: "Toutes", by: "Système (auto)", date: "01/08/2026", size: "2.4 Mo", format: "PDF" },
  { title: "Rapport d'incident — Crue Baguida", type: "incident", period: "07 août 2026", zones: "Baguida", by: "Koffi Adjovi", date: "07/08/2026", size: "1.1 Mo", format: "PDF" },
  { title: "Export pluviométrie — T2 2026", type: "export", period: "avr.–juin 2026", zones: "Toutes", by: "Ama Séna", date: "05/07/2026", size: "640 Ko", format: "CSV" },
  { title: "Rapport mensuel — Juin 2026", type: "monthly", period: "01–30 juin 2026", zones: "Toutes", by: "Système (auto)", date: "01/07/2026", size: "2.1 Mo", format: "PDF" },
  { title: "Rapport d'incident — Crue Kodjoviakopé", type: "incident", period: "03 août 2026", zones: "Kodjoviakopé", by: "Koffi Adjovi", date: "03/08/2026", size: "980 Ko", format: "PDF" },
  { title: "Analyse urbaine — zones à risque récurrent", type: "planning", period: "jan.–juil. 2026", zones: "Toutes", by: "Koffi Adjovi", date: "20/07/2026", size: "3.6 Mo", format: "PDF" },
  { title: "Export alertes envoyées — Juillet 2026", type: "export", period: "juillet 2026", zones: "Toutes", by: "Système (auto)", date: "01/08/2026", size: "210 Ko", format: "CSV" },
  { title: "Rapport mensuel — Mai 2026", type: "monthly", period: "01–31 mai 2026", zones: "Toutes", by: "Système (auto)", date: "01/06/2026", size: "1.9 Mo", format: "PDF" },
];

export const monthlyTrend = {
  months: ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août"],
  values: [8, 11, 14, 10, 9, 12, 15, 13, 18, 22, 27, 19],
};

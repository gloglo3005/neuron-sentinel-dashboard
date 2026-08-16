// Demo dataset for the Signalements citoyens page, used when the backend
// isn't reachable — see useIncidents.js / useDataSource.js. Same status set
// as backend/prisma/schema.prisma's IncidentReport (PENDING is the default;
// an authority must explicitly move it to CONFIRMED/REJECTED/VERIFYING, a
// report is never assumed true — spec section 17).

export const typeLabels = {
  inondation: 'Route inondée',
  debordement: 'Débordement caniveau/cours d\u2019eau',
  degats: 'Dégâts matériels',
  personne_bloquee: 'Personne(s) bloquée(s)',
  autre: 'Autre',
};

export const initialIncidents = [
  {
    id: 'inc-1', type: 'inondation', description: "Eau à hauteur de genou sur environ 200m, plusieurs motos bloquées.",
    status: 'PENDING', zoneName: 'Bè', reporterName: 'Anonyme',
    latitude: 6.121, longitude: 1.222, time: 'Aujourd\u2019hui, 14:32',
    media: [{ id: 'm1', type: 'image', url: null }],
  },
  {
    id: 'inc-2', type: 'debordement', description: 'Caniveau débordé devant le marché, odeur suspecte.',
    status: 'PENDING', zoneName: 'Adidogomé', reporterName: 'Ama K.',
    latitude: 6.178, longitude: 1.205, time: 'Aujourd\u2019hui, 13:50',
    media: [],
  },
  {
    id: 'inc-3', type: 'personne_bloquee', description: 'Une famille bloquée au 2e étage, montée des eaux rapide.',
    status: 'VERIFYING', zoneName: 'Baguida', reporterName: 'Anonyme',
    latitude: 6.15, longitude: 1.34, time: 'Aujourd\u2019hui, 12:10',
    media: [{ id: 'm2', type: 'image', url: null }],
  },
  {
    id: 'inc-4', type: 'debordement', description: 'Confirmé par un agent terrain, intervention en cours.',
    status: 'CONFIRMED', zoneName: 'Adidogomé', reporterName: 'Koffi A.',
    latitude: 6.178, longitude: 1.205, time: 'Aujourd\u2019hui, 11:05',
    media: [],
  },
  {
    id: 'inc-5', type: 'inondation', description: 'Voie principale coupée, déviation en place côté nord.',
    status: 'CONFIRMED', zoneName: 'Baguida', reporterName: 'Anonyme',
    latitude: 6.152, longitude: 1.341, time: 'Hier, 22:40',
    media: [{ id: 'm3', type: 'image', url: null }],
  },
  {
    id: 'inc-6', type: 'autre', description: "Aucune trace d'inondation constatée sur place.",
    status: 'REJECTED', zoneName: 'Agoè', reporterName: 'Anonyme',
    latitude: 6.201, longitude: 1.198, time: 'Hier, 18:15',
    media: [],
  },
];
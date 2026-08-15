import { useState, useMemo } from 'react';
import { TopBar } from '../components/TopNav';
import { Card, Btn, DataSourceBadge } from '../components/ui';
import { typeMeta } from '../data/reports';
import { useReports } from '../hooks/useReports';
import { reportsService } from '../services/reportsService';

const DAMAGE_TYPE_LABELS = {
  habitation: 'Habitations', route: 'Routes', entreprise: 'Entreprises',
  population: 'Personnes affectées', zone_inhabitable: 'Zone rendue inhabitable', infra_critique: 'Infrastructure critique',
};

function fileIconFor(format) {
  if (format === 'CSV') return { bg: '#EFEBFD', fg: '#6C5CE7' };
  if (format === 'XLSX') return { bg: '#E6F7EC', fg: '#1E9E5A' };
  return { bg: '#E7EFFD', fg: '#2E6FDE' };
}

function TrendChart({ monthlyTrend }) {
  const { months, values } = monthlyTrend;
  const w = 700, h = 190, pad = 26, max = 30;
  const barW = ((w - pad * 2) / values.length) * 0.6;
  const gap = (w - pad * 2) / values.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full block" style={{ height: h }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#E6EAF1" strokeWidth="1" />
      {values.map((v, i) => {
        const bh = (v / max) * (h - pad * 2);
        const x = pad + i * gap + (gap - barW) / 2;
        const y = h - pad - bh;
        const isLast = i === values.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx="4" fill={isLast ? '#6C5CE7' : '#006A4E'} opacity={isLast ? 1 : 0.75} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#5B6576" fontFamily="Manrope">{v}</text>
            <text x={x + barW / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#96A1B3">{months[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Reports() {
  const { reports, setReports, monthlyTrend, loading, source } = useReports();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [genType, setGenType] = useState('monthly');
  const [genFrom, setGenFrom] = useState('');
  const [genTo, setGenTo] = useState('');
  const [genZone, setGenZone] = useState('Toutes');
  const [selectedFormat, setSelectedFormat] = useState('PDF');

  // Real damage-report form — POST /api/reports (see
  // backend/src/controllers/reportsController.js). Unlike "Générer un
  // rapport" below (a local-only preview, since the backend doesn't
  // generate downloadable files), this one is persisted: it attaches a
  // damage assessment to an already resolved/closed alert.
  const incidentOptions = useMemo(() => reports.filter((r) => r.id), [reports]);
  const [damageAlertId, setDamageAlertId] = useState('');
  const [damageType, setDamageType] = useState('habitation');
  const [damageQuantity, setDamageQuantity] = useState('');
  const [damageSeverity, setDamageSeverity] = useState('MODERATE');
  const [damageSubmitting, setDamageSubmitting] = useState(false);
  const [damageError, setDamageError] = useState(null);
  const [damageSuccess, setDamageSuccess] = useState(false);

  async function submitDamageReport() {
    if (!damageAlertId) {
      setDamageError('Sélectionnez un incident.');
      return;
    }
    setDamageError(null);
    setDamageSuccess(false);
    setDamageSubmitting(true);
    try {
      await reportsService.create({
        alertId: damageAlertId,
        damages: [{
          type: damageType,
          quantity: damageQuantity ? Number(damageQuantity) : undefined,
          severity: damageSeverity,
          source: 'terrain',
        }],
      });
      setDamageSuccess(true);
      setDamageQuantity('');
    } catch (err) {
      setDamageError(err.message || 'Une erreur est survenue.');
    } finally {
      setDamageSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      return true;
    });
  }, [reports, search, typeFilter]);

  function generateReport() {
    const typeLabels = { monthly: 'Rapport mensuel', incident: "Rapport d'incident", export: 'Export de données', planning: 'Analyse pour planification urbaine' };
    const newReport = {
      title: `${typeLabels[genType]} — ${genZone}`,
      type: genType,
      period: genFrom && genTo ? `${genFrom} au ${genTo}` : 'Période non précisée',
      zones: genZone, by: 'Koffi Adjovi',
      date: new Date().toLocaleDateString('fr-FR'), size: '— (génération…)', format: selectedFormat,
    };
    setReports((prev) => [newReport, ...prev]);
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Rapports & historique" />
        <div className="px-7 py-10 text-center text-text-tertiary text-[13px]">Chargement des rapports…</div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Rapports & historique" />
      <div className="px-7 py-5 flex flex-col gap-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
          <Card
            title="Tous les rapports"
            right={
              <div className="flex gap-2 flex-wrap items-center">
                <DataSourceBadge source={source} loading={loading} />
                <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
                       className="border border-border rounded-lg px-2.5 py-1.5 text-[12px] outline-none focus:border-brand w-[160px]" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-border rounded-lg px-2 py-1.5 text-[12px] outline-none">
                  <option value="all">Tous types</option>
                  {Object.entries(typeMeta).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            }
          >
            {filtered.length === 0 ? (
              <div className="text-center text-text-tertiary text-[12px] py-8">Aucun rapport ne correspond à ces filtres.</div>
            ) : (
              <div className="overflow-x-auto -mx-[18px] px-[18px]">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr className="text-left text-[10.5px] uppercase tracking-wide text-text-tertiary font-semibold border-b border-border">
                      <th className="pb-2.5">Rapport</th><th className="pb-2.5">Type</th><th className="pb-2.5">Période</th>
                      <th className="pb-2.5">Zones</th><th className="pb-2.5">Par</th><th className="pb-2.5">Date</th><th className="pb-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const tm = typeMeta[r.type];
                      const fi = fileIconFor(r.format);
                      return (
                        <tr key={i} className="border-b border-border-soft align-middle">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: fi.bg, color: fi.fg }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 2h9l5 5v15H6z" /><path d="M15 2v5h5" /></svg>
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold truncate max-w-[220px]">{r.title}</div>
                                <div className="text-[10.5px] text-text-tertiary">{r.format} · {r.size}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3"><span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: tm.soft, color: tm.color }}>{tm.label}</span></td>
                          <td className="py-3 text-[12px] text-text-secondary whitespace-nowrap">{r.period}</td>
                          <td className="py-3 text-[12px] text-text-secondary">{r.zones}</td>
                          <td className="py-3 text-[12px] text-text-secondary whitespace-nowrap">{r.by}</td>
                          <td className="py-3 text-[11.5px] text-text-tertiary whitespace-nowrap">{r.date}</td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Btn variant="ghost" onClick={() => alert(`Aperçu de « ${r.title} »`)}>Voir</Btn>
                              <Btn variant="primary" onClick={() => alert(`Téléchargement de « ${r.title} » (${r.format})`)}>Télécharger</Btn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Générer un rapport" subtitle="Créer un nouveau rapport personnalisé">
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Type de rapport</label>
                <select value={genType} onChange={(e) => setGenType(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand">
                  <option value="monthly">Rapport mensuel</option>
                  <option value="incident">Rapport d'incident</option>
                  <option value="export">Export de données</option>
                  <option value="planning">Analyse pour planification urbaine</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Du</label>
                  <input type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12px] outline-none focus:border-brand" />
                </div>
                <div className="flex-1">
                  <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Au</label>
                  <input type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12px] outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Zone(s)</label>
                <select value={genZone} onChange={(e) => setGenZone(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand">
                  <option value="Toutes">Toutes les zones</option>
                  <option value="Baguida">Baguida</option>
                  <option value="Kodjoviakopé">Kodjoviakopé</option>
                  <option value="Djidjolé">Djidjolé</option>
                </select>
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Format</label>
                <div className="flex gap-2">
                  {['PDF', 'CSV', 'XLSX'].map((f) => (
                    <label key={f} className={`flex-1 text-center px-2.5 py-1.5 rounded-lg text-[12px] border cursor-pointer font-semibold ${selectedFormat === f ? 'bg-brand-soft border-brand text-brand' : 'border-border text-text-secondary'}`}>
                      <input type="radio" className="hidden" checked={selectedFormat === f} onChange={() => setSelectedFormat(f)} />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
              <Btn variant="primary" onClick={generateReport} className="text-center py-2.5">Générer le rapport</Btn>
              <div className="text-[10.5px] text-text-tertiary text-center">
                Aperçu local uniquement — la génération de fichier téléchargeable n'est pas encore reliée au serveur.
              </div>
            </div>
          </Card>
        </div>

        <Card title="Ajouter un rapport de dégâts" subtitle="Rattaché à un incident résolu ou clôturé — enregistré côté serveur">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_0.8fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Incident</label>
              <select value={damageAlertId} onChange={(e) => setDamageAlertId(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand">
                <option value="">Sélectionner…</option>
                {incidentOptions.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              {!incidentOptions.length && (
                <div className="text-[10.5px] text-text-tertiary mt-1">Aucun incident résolu/clôturé disponible pour l'instant.</div>
              )}
            </div>
            <div>
              <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Type de dégât</label>
              <select value={damageType} onChange={(e) => setDamageType(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand">
                {Object.entries(DAMAGE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Quantité</label>
              <input type="number" min="0" value={damageQuantity} onChange={(e) => setDamageQuantity(e.target.value)} placeholder="—" className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-[11.5px] font-semibold text-text-secondary block mb-1.5">Gravité</label>
              <select value={damageSeverity} onChange={(e) => setDamageSeverity(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-2 text-[12.5px] outline-none focus:border-brand">
                <option value="LOW">Faible</option>
                <option value="MODERATE">Moyenne</option>
                <option value="HIGH">Élevée</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>
            <Btn variant="primary" onClick={submitDamageReport} disabled={damageSubmitting} className="py-2.5">
              {damageSubmitting ? '…' : 'Enregistrer'}
            </Btn>
          </div>
          {damageError && <div className="mt-3 text-[12px] text-risk-high bg-risk-high-soft border border-risk-high/20 rounded-lg px-3 py-2">{damageError}</div>}
          {damageSuccess && <div className="mt-3 text-[12px] text-risk-low bg-risk-low-soft border border-risk-low/20 rounded-lg px-3 py-2">Rapport de dégâts enregistré.</div>}
        </Card>

        <Card title="Alertes émises par mois" subtitle="12 derniers mois">
          <TrendChart monthlyTrend={monthlyTrend} />
        </Card>
      </div>
    </div>
  );
}

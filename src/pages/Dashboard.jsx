import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/TopNav';
import { Card, RiskBadge, Btn, Dot, DataSourceBadge } from '../components/ui';
import ZoneMap from '../components/ZoneMap';
import BarChart from '../components/charts/BarChart';
import AreaLineChart from '../components/charts/AreaLineChart';
import { levelOf, riskColor, riskName } from '../data/zones';
import { statusMeta, openStatuses } from '../data/alerts';
import { useZones } from '../hooks/useZones';
import { useAlerts } from '../hooks/useAlerts';
import { usePredictions } from '../hooks/usePredictions';
import { useSelectedZone } from '../context/SelectedZonecontext';

const rain = [
  { t: '00h', v: 4 }, { t: '04h', v: 9 }, { t: '08h', v: 14 }, { t: '12h', v: 22 },
  { t: '16h', v: 18 }, { t: '20h', v: 11 }, { t: '24h', v: 6 },
];
const riskSeries = [30, 32, 35, 38, 42, 48, 55, 60, 63, 66, 63, 58];

// Real factor keys either AI provider can produce (see aiService.js) —
// same set as AIPredictions.jsx's global panel. Replaces a previous
// static `factors` array that showed the same 3 invented reasons
// ("61mm cumulés...", "3 épisodes de crue depuis 2021"...) for every
// zone, unchanged, regardless of which quartier was actually selected.
const FACTOR_META = {
  rain: { label: 'Pluviométrie', color: 'risk-high' },
  drain: { label: 'Capacité de drainage', color: 'risk-medium' },
  hist: { label: 'Historique des crues', color: 'brand' },
  base: { label: 'Base de référence du modèle', color: 'risk-medium' },
};

// 4-tier reading of an aggregate 0-100 score, for the "Niveau X/4" chip.
function tierOf(avg) {
  if (avg >= 75) return { tier: 4, label: 'Critique' };
  if (avg >= 50) return { tier: 3, label: 'Élevé' };
  if (avg >= 25) return { tier: 2, label: 'Modéré' };
  return { tier: 1, label: 'Faible' };
}

function relativeTime(iso) {
  if (!iso) return null;
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return `il y a ${Math.round(diffH / 24)} j`;
}

export default function Dashboard() {
  const { selectedZone: selected, setSelectedZone: setSelected } = useSelectedZone();
  const { zones, zoneNames, loading: zonesLoading, source: zonesSource } = useZones();
  const { alerts, loading: alertsLoading } = useAlerts();
  const { zoneExplain, modelSource, latestGeneratedAt, loading: predictionsLoading } = usePredictions();

  // Real per-zone factor breakdown for the currently selected zone (same
  // source as AIPredictions.jsx's waterfall — see predictionsService.js).
  // Replaces a static array that showed identical "reasons" for every
  // zone regardless of which one was selected.
  // Must run on every render, including the loading one below — hooks
  // can't be called conditionally (this used to sit after the early
  // return, which meant one fewer hook fired on the loading render than
  // on the loaded one → "Rendered more hooks than during the previous
  // render." / React error #310 in production).
  const zoneFactors = useMemo(() => {
    const z = zoneExplain[selected];
    if (!z) return [];
    const entries = Object.keys(FACTOR_META)
      .map((key) => ({ key, contribution: z[key] || 0 }))
      .filter((f) => f.contribution !== 0);
    const total = entries.reduce((s, f) => s + Math.abs(f.contribution), 0);
    if (!total) return [];
    return entries
      .map((f) => ({
        label: FACTOR_META[f.key].label,
        color: FACTOR_META[f.key].color,
        weight: Math.round((Math.abs(f.contribution) / total) * 100),
        width: Math.min(100, Math.round((Math.abs(f.contribution) / total) * 100 * 2)),
        desc: `Contribution de ${f.contribution >= 0 ? '+' : ''}${f.contribution} point${Math.abs(f.contribution) > 1 ? 's' : ''} au score de risque de ${selected}.`,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [zoneExplain, selected]);

  if (zonesLoading || !zones[selected]) {
    return (
      <div>
        <TopBar title="Flood Monitoring Dashboard" />
        <div className="px-7 py-10 text-center text-text-tertiary text-[13px]">Chargement des données…</div>
      </div>
    );
  }

  const z = zones[selected];
  const level = levelOf(z.series[0]);

  const highCount = Object.values(zones).filter((zz) => levelOf(zz.series[0]) === 'high').length;
  const medCount = Object.values(zones).filter((zz) => levelOf(zz.series[0]) === 'medium').length;

  // Aggregate KPIs are derived from the current dataset (mock or real),
  // never hard-coded — see spec section 7.
  const currentVals = Object.values(zones).map((zz) => zz.series[0]);
  const aggregateRisk = Math.round(currentVals.reduce((s, v) => s + v, 0) / (currentVals.length || 1));
  const { tier, label: tierLabel } = tierOf(aggregateRisk);
  const topZoneEntry = Object.entries(zones).sort((a, b) => b[1].series[0] - a[1].series[0])[0];
  const totalExposedPop = Object.entries(zones)
    .filter(([, zz]) => levelOf(zz.series[0]) !== 'low')
    .reduce((s, [, zz]) => s + zz.pop, 0);

  const confidenceValues = Object.values(zoneExplain).map((p) => p.confidence).filter((v) => typeof v === 'number');
  const avgConfidence = confidenceValues.length
    ? Math.round(confidenceValues.reduce((s, v) => s + v, 0) / confidenceValues.length)
    : null;
  const modelLabel = modelSource === 'REMOTE' ? "Service IA de l'équipe" : modelSource === 'MOCK' ? 'Scoring interne (MOCK)' : 'Aucune prédiction';
  const modelSynced = relativeTime(latestGeneratedAt);

  const topAlerts = alerts.filter((a) => openStatuses.includes(a.status)).slice(0, 3);

  return (
    <div>
      <TopBar title="Flood Monitoring Dashboard" />
      <div className="px-7 py-5 flex flex-col gap-4 pb-10">
        {/* KPI ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">Niveau de risque actuel</span>
              <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-risk-medium-soft text-risk-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
                  <path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                </svg>
              </div>
            </div>
            <div className="font-display text-[25px] font-extrabold mt-2.5 flex items-baseline gap-1.5">
              {tierLabel} <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-risk-medium-soft text-risk-medium">Niveau {tier}/4</span>
            </div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">Indice agrégé, {zoneNames.length} quartiers</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">Probabilité d'inondation</span>
              <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-brand-soft text-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
                  <path d="M12 2.5c3 3.5 6 7.1 6 11a6 6 0 01-12 0c0-3.9 3-7.5 6-11z" />
                </svg>
              </div>
            </div>
            <div className="font-display text-[25px] font-extrabold mt-2.5">{aggregateRisk}%</div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">Zone la plus exposée — {topZoneEntry[0]}</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">Population potentiellement exposée</span>
              <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-brand-soft text-brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
                  <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z" />
                </svg>
              </div>
            </div>
            <div className="font-display text-[25px] font-extrabold mt-2.5">{totalExposedPop.toLocaleString('fr-FR')}</div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">{zoneNames.length} quartiers surveillés — {highCount} en risque élevé, {medCount} en vigilance</div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">Confiance du modèle IA</span>
              <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-risk-low-soft text-risk-low">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
                  <path d="M12 2l2.5 5.5L20 8l-4.5 4 1 6-4.5-3-4.5 3 1-6L4 8l5.5-.5z" />
                </svg>
              </div>
            </div>
            <div className="font-display text-[25px] font-extrabold mt-2.5">{predictionsLoading || avgConfidence === null ? '—' : `${avgConfidence}%`}</div>
            <div className="text-[11.5px] text-text-tertiary mt-1.5">{modelLabel}{modelSynced ? ` — ${modelSynced}` : ''}</div>
          </Card>
        </div>

        {/* MAP + DETAIL */}
        <Card
          title="Carte de risque — Lomé"
          subtitle="Cliquez sur un quartier pour voir le détail de la prédiction"
          right={
            <div className="flex items-center gap-3.5">
              {['low', 'medium', 'high'].map((l) => (
                <div key={l} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <Dot color={riskColor[l]} /> {riskName[l]}
                </div>
              ))}
              <DataSourceBadge source={zonesSource} loading={zonesLoading} />
            </div>
          }
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <ZoneMap zones={zones} selectedZone={selected} onSelect={setSelected} height={300} />
            </div>
            <div className="w-full lg:w-[220px] flex-shrink-0 bg-surface-alt border border-border-soft rounded-xl p-3.5">
              <div className="text-[13.5px] font-bold">{selected}</div>
              <div className="mt-1.5"><RiskBadge level={level} value={z.series[0]} /></div>
              <div className="flex justify-between text-[11.5px] text-text-secondary py-1.5 border-b border-dashed border-border mt-2.5">
                <span>Prédiction</span><b className="text-text-primary font-semibold">Pic estimé ce soir</b>
              </div>
              <div className="flex justify-between text-[11.5px] text-text-secondary py-1.5 border-b border-dashed border-border">
                <span>Population</span><b className="text-text-primary font-semibold">≈ {z.pop.toLocaleString('fr-FR')} hab.</b>
              </div>
              <div className="mt-2.5 space-y-2">
                {[
                  { label: 'Pluviométrie', val: z.rain, color: riskColor.high },
                  { label: 'Capacité drainage', val: z.drain, color: riskColor.low },
                  { label: 'Historique crues', val: z.hist, color: '#006A4E' },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between text-[10.5px] text-text-secondary mb-1"><span>{f.label}</span><span>{f.val}{f.label === 'Pluviométrie' ? 'mm' : '%'}</span></div>
                    <div className="h-[5px] bg-border rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${f.val}%`, background: f.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* WEATHER + PREDICTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Prévisions de pluie — 24h" subtitle="Cumul attendu par tranche de 4h (mm)">
            <div className="flex gap-2.5 mb-3.5">
              {[['27°C', 'Température'], ['88%', 'Humidité'], ['18 km/h', 'Vent']].map(([v, l]) => (
                <div key={l} className="flex-1 bg-surface-alt border border-border-soft rounded-[10px] p-2.5 text-center">
                  <div className="font-display font-bold text-[15px]">{v}</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <BarChart data={rain} />
          </Card>

          <Card title="Évolution du risque — 24h" subtitle="Indice de risque agrégé, toutes zones">
            <AreaLineChart series={riskSeries} gradientId="dashRiskGrad" />
          </Card>
        </div>

        {/* AI EXPLANATION */}
        <Card title="Pourquoi ce niveau de risque ?" subtitle={`Facteurs pris en compte par le modèle pour la zone ${selected}`}>
          {zoneFactors.length ? (
            <div className="flex flex-col gap-3.5">
              {zoneFactors.map((f) => (
              <div key={f.label} className="flex items-center gap-3.5">
                <div className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                     style={{ background: f.color === 'brand' ? '#E3F2ED' : (f.color === 'risk-high' ? '#FCE7E7' : '#FDF1DE'), color: f.color === 'brand' ? '#006A4E' : (f.color === 'risk-high' ? '#DC3B3B' : '#EF8F1E') }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[12.5px] font-semibold mb-1">
                    <span>{f.label}</span><span className="text-text-tertiary font-semibold">Poids {f.weight}%</span>
                  </div>
                  <div className="text-[11.5px] text-text-secondary">{f.desc}</div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden mt-1.5">
                    <div className="h-full rounded-full" style={{ width: `${f.width}%`, background: f.color === 'brand' ? '#006A4E' : (f.color === 'risk-high' ? '#DC3B3B' : '#EF8F1E') }} />
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-text-tertiary py-2">
              Le modèle actif ({modelSource === 'REMOTE' ? "service de l'équipe" : 'interne'}) ne renvoie pas de
              décomposition par facteur pour {selected}.
            </div>
          )}
        </Card>

        {/* ALERTS */}
        <Card
          title="Alertes actives"
          subtitle={alertsLoading ? 'Chargement…' : `${topAlerts.length} alerte(s) nécessitent une action`}
        >
          {topAlerts.length === 0 ? (
            <div className="text-center text-text-tertiary text-[12px] py-6">Aucune alerte active pour le moment.</div>
          ) : (
            <div className="overflow-x-auto -mx-[18px] px-[18px]">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-left text-[10.5px] uppercase tracking-wide text-text-tertiary font-semibold border-b border-border">
                    <th className="pb-2.5">Localisation</th><th className="pb-2.5">Risque</th><th className="pb-2.5">Statut</th><th className="pb-2.5">Dernière mise à jour</th><th className="pb-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {topAlerts.map((a) => {
                    const sm = statusMeta[a.status];
                    return (
                      <tr key={a.id} className="border-b border-border-soft">
                        <td className="py-3 font-semibold flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={riskColor[a.level]} strokeWidth="2.2">
                            <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.2" />
                          </svg>
                          {a.zones.length > 1 ? `${a.zones[0]} +${a.zones.length - 1}` : a.zones[0]}
                        </td>
                        <td className="py-3"><RiskBadge level={a.level} /></td>
                        <td className="py-3">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sm.soft, color: sm.color }}>{sm.label}</span>
                        </td>
                        <td className="py-3 text-[12.5px] text-text-secondary">{a.time}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Link to="/alerts"><Btn variant="primary">Gérer</Btn></Link>
                            <Link to="/risk-map"><Btn variant="ghost">Voir détails</Btn></Link>
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
      </div>
    </div>
  );
}

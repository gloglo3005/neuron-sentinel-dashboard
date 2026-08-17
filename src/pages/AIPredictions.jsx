import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopNav';
import { Card, DataSourceBadge, Btn } from '../components/ui';
import AreaLineChart from '../components/charts/AreaLineChart';
import RadialGauge from '../components/charts/RadialGauge';
import { globalFeatures, dataSources, srcStatusMeta, featureLabels } from '../data/aiPredictions';
import { usePredictions } from '../hooks/usePredictions';
import { useZones } from '../hooks/useZones';
import { useSelectedZone } from '../context/SelectedZonecontext';
import { predictionsService } from '../services/predictionsService';

export default function AIPredictions() {
  const navigate = useNavigate();
  const { selectedZone: zoneName, setSelectedZone: setZoneName } = useSelectedZone();
  const { zoneExplain, confidenceSeries, accuracySeries, trendDays, loading, source, refresh } = usePredictions();
  // Needed to resolve zoneName -> zoneId for POST /predictions/generate —
  // the backend endpoint already existed (see
  // backend/src/controllers/predictionsController.js) but nothing in the
  // dashboard ever called it, so predictions only ever came from seed
  // data. Only meaningful once we're talking to the real backend (source
  // === 'real'); in mock mode there's no zone id to generate against.
  const { zones, source: zonesSource } = useZones();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  async function handleGenerate() {
    const zoneId = zones[zoneName]?.id;
    if (!zoneId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      await predictionsService.generate(zoneId, 6);
      await refresh();
    } catch (err) {
      setGenerateError(err.message || 'Une erreur est survenue.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading || !zoneExplain[zoneName]) {
    return (
      <div>
        <TopBar title="Prédictions IA — Explicabilité du modèle" />
        <div className="px-7 py-10 text-center text-text-tertiary text-[13px]">Chargement des prédictions…</div>
      </div>
    );
  }

  const z = zoneExplain[zoneName];

  let cumulative = 0;
  const order = ['base', 'rain', 'drain', 'hist', 'urban', 'proximity'];
  const wfRows = order.map((key) => {
    const v = z[key];
    const start = cumulative;
    cumulative += v;
    const isBase = key === 'base';
    const left = Math.min(start, cumulative);
    const width = Math.max(Math.abs(v), 1);
    const color = isBase ? '#96A1B3' : v >= 0 ? '#1E9E5A' : '#DC3B3B';
    return { key, v, left, width, color, isBase };
  });

  const uncertainty = Math.round((100 - z.confidence) / 2);

  return (
    <div>
      <TopBar title="Prédictions IA — Explicabilité du modèle" />
      <div className="px-7 py-5 flex flex-col gap-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Importance des variables — modèle global" subtitle="Contribution moyenne de chaque facteur, toutes zones confondues">
            <div className="flex flex-col gap-3">
              {globalFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-[150px] text-[12px] text-text-secondary flex-shrink-0">{f.label}</div>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${f.val}%`, background: '#6C5CE7' }} />
                  </div>
                  <div className="text-[12px] font-semibold w-9 text-right">{f.val}%</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Sources de données" subtitle="État des flux alimentant le modèle">
            <div className="flex flex-col gap-2.5">
              {dataSources.map((s) => {
                const sm = srcStatusMeta[s.status];
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: sm.soft, color: sm.color }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[17px] h-[17px]">
                        <path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2z" /><path d="M4 6v12c0 1.1 3.6 2 8 2s8-.9 8-2V6" /><path d="M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold truncate">{s.name}</div>
                      <div className="text-[10.5px] text-text-tertiary truncate">{s.meta} · synchronisé {s.sync}</div>
                    </div>
                    <div className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: sm.soft, color: sm.color }}>{sm.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card
          title="Pourquoi ce score ? — détail par quartier"
          subtitle="Décomposition additive du score de risque (waterfall)"
          right={
            <div className="flex items-center gap-2.5">
              <select value={zoneName} onChange={(e) => setZoneName(e.target.value)} className="border border-border rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none focus:border-brand">
                {Object.keys(zoneExplain).map((zn) => <option key={zn} value={zn}>{zn}</option>)}
              </select>
              {zonesSource === 'real' && (
                <Btn variant="ghost" onClick={handleGenerate} className={generating ? 'opacity-50 pointer-events-none' : ''}>
                  {generating ? 'Génération…' : 'Générer une nouvelle prédiction'}
                </Btn>
              )}
              <DataSourceBadge source={source} loading={loading} />
            </div>
          }
        >
          {generateError && (
            <div className="mb-3 text-[12px] text-risk-high bg-risk-high-soft rounded-lg px-3 py-2">{generateError}</div>
          )}
          {z.risk >= 40 && (
            <div className="flex items-center justify-between gap-3 mb-4 bg-ai-soft rounded-xl p-3" style={{ background: '#EFEBFD' }}>
              <div className="text-[12px] text-text-secondary max-w-md">
                Une prédiction n'est pas une alerte officielle : elle doit être examinée et confirmée par une autorité avant toute diffusion.
              </div>
              <Btn variant="primary" onClick={() => navigate('/alerts', { state: { proposeZone: zoneName, predictionId: z.predictionId } })}>
                Examiner l'alerte
              </Btn>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {wfRows.map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <div className="w-[160px] text-[12px] font-semibold flex-shrink-0">{featureLabels[row.key]}</div>
                <div className="flex-1 h-3.5 bg-border-soft rounded relative overflow-hidden">
                  <div className="absolute top-0 h-full rounded" style={{ left: `${row.left}%`, width: `${row.width}%`, background: row.color }} />
                </div>
                <div className="w-12 text-right text-[12px] font-bold flex-shrink-0" style={{ color: row.isBase ? '#141B2C' : row.color }}>
                  {row.isBase ? `${row.v}%` : `${row.v >= 0 ? '+' : ''}${row.v}%`}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2 border-t border-border-soft mt-1">
              <div className="w-[160px] text-[12px] font-bold flex-shrink-0">Score final</div>
              <div className="flex-1 h-3.5 bg-border-soft rounded relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full rounded" style={{ width: `${z.risk}%`, background: 'linear-gradient(90deg, #6C5CE7, #9B8FF2)' }} />
              </div>
              <div className="w-12 text-right text-[13px] font-extrabold flex-shrink-0">{z.risk}%</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
          <Card title="Confiance de la prédiction" subtitle={`Pour ${zoneName}`}>
            <div className="flex flex-col items-center gap-3">
              <RadialGauge value={z.confidence} />
              <div className="text-[12px] text-text-secondary text-center">
                Intervalle estimé : <b className="text-text-primary">{Math.max(0, z.risk - uncertainty)}% – {Math.min(100, z.risk + uncertainty)}%</b> de probabilité d'inondation
              </div>
            </div>
          </Card>

          <Card title="Performance du modèle — 14 derniers jours" subtitle="Confiance moyenne (violet) vs précision réelle (vert pointillé)">
            <AreaLineChart series={confidenceSeries} secondSeries={accuracySeries} color="#6C5CE7" secondColor="#1E9E5A" min={75} gradientId="aiTrendGrad" />
            <div className="flex justify-between mt-1">
              {trendDays.filter((_, i) => i % 2 === 0).map((d) => <span key={d} className="text-[9px] text-text-tertiary">{d}</span>)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

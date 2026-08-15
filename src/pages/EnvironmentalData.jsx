import { useState } from 'react';
import { TopBar } from '../components/TopNav';
import { Card, Btn, DataSourceBadge } from '../components/ui';
import { plannedSensors, drainColor, drainSoft } from '../data/environmental';
import { srcStatusMeta } from '../data/aiPredictions';
import { useEnvironmentalData } from '../hooks/useEnvironmentalData';
import { environmentalService } from '../services/environmentalService';
import { useSelectedZone } from '../context/SelectedZoneContext';

const icons = {
  rain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 8a6 6 0 10-12 0c0 3-2 5-2 5h16s-2-2-2-5z" /><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" /></svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ),
};

function RainChart({ observedRain, forecastRain }) {
  const all = observedRain.concat(forecastRain);
  const w = 600, h = 170, pad = 8, max = 10;
  const stepX = (w - pad * 2) / (all.length - 1);
  const y = (v) => h - pad - (v / max) * (h - pad * 2);
  const fcPts = forecastRain.map((v, i) => `${pad + (observedRain.length - 1 + i) * stepX},${y(v)}`).join(' ');
  const splitX = pad + (observedRain.length - 1) * stepX;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full block" style={{ height: h }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#E6EAF1" strokeWidth="1" />
      <line x1={splitX} y1={pad} x2={splitX} y2={h - pad} stroke="#E6EAF1" strokeWidth="1" strokeDasharray="3 3" />
      {observedRain.map((v, i) => (
        <rect key={i} x={pad + i * stepX - 1.4} y={y(v)} width="2.8" height={h - pad - y(v)} fill="#3E8FDE" opacity="0.55" rx="1" />
      ))}
      <polyline points={fcPts} fill="none" stroke="#96A1B3" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

export default function EnvironmentalData() {
  const { observedRain, forecastRain, forecast5, envZones, dataFeeds, loading, source, refresh } = useEnvironmentalData();
  const { selectedZone, setSelectedZone } = useSelectedZone();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await environmentalService.sync();
      setSyncResult(r);
      refresh();
    } catch (err) {
      setSyncResult({ error: err.message || 'Une erreur est survenue.' });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Données environnementales" />
        <div className="px-7 py-10 text-center text-text-tertiary text-[13px]">Chargement des données environnementales…</div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Données environnementales" />
      <div className="px-7 py-5 flex flex-col gap-4 pb-10">
        <Card
          title="Pluviométrie — 48h passées / 24h prévues"
          subtitle="Barres = observé (mm/h) · ligne pointillée = prévision"
          right={
            <div className="flex items-center gap-2">
              <Btn onClick={handleSync} disabled={syncing} variant="ghost">
                {syncing ? 'Synchronisation…' : 'Synchroniser la météo'}
              </Btn>
              <DataSourceBadge source={source} loading={loading} />
            </div>
          }
        >
          {syncResult && (
            <div className={`mb-3 text-[12px] rounded-lg px-3 py-2 border ${syncResult.error ? 'text-risk-high bg-risk-high-soft border-risk-high/20' : 'text-risk-low bg-risk-low-soft border-risk-low/20'}`}>
              {syncResult.error
                ? syncResult.error
                : syncResult.mock
                  ? `${syncResult.synced}/${syncResult.total} zones synchronisées — mode MOCK côté serveur (WEATHER_API_KEY non configurée, données simulées).`
                  : `${syncResult.synced}/${syncResult.total} zones synchronisées via OpenWeatherMap.`}
            </div>
          )}
          <RainChart observedRain={observedRain} forecastRain={forecastRain} />
          <div className="flex gap-4 mt-2 text-[11px] text-text-tertiary">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm" style={{ background: '#3E8FDE', opacity: 0.55 }} /> Observé</span>
            <span className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed" style={{ borderColor: '#96A1B3' }} /> Prévu</span>
          </div>
        </Card>

        <Card title="Prévisions à 5 jours" subtitle="Lomé, Togo">
          <div className="flex flex-col divide-y divide-border-soft">
            {forecast5.map((f) => (
              <div key={f.day} className="flex items-center gap-4 py-2.5">
                <div className="w-10 text-[12.5px] font-semibold flex-shrink-0">{f.day}</div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: f.type === 'rain' ? '#E7F1FC' : f.type === 'sun' ? '#FDF1DE' : '#F7F9FC',
                    color: f.type === 'rain' ? '#3E8FDE' : f.type === 'sun' ? '#EF8F1E' : '#96A1B3',
                  }}
                >
                  {icons[f.type]}
                </div>
                <div className="flex-1 text-[12px] text-text-secondary min-w-0">{f.desc}</div>
                <div className="text-[12px] font-semibold w-20 text-right flex-shrink-0">{f.temp}</div>
                <div className="text-[12px] text-rain font-semibold w-10 text-right flex-shrink-0">{f.precip}%</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Données par quartier" subtitle="Facteurs environnementaux mesurés">
          <div className="overflow-x-auto -mx-[18px] px-[18px]">
            <table className="w-full border-collapse min-w-[680px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wide text-text-tertiary font-semibold border-b border-border">
                  <th className="pb-2.5">Quartier</th><th className="pb-2.5">Pluviométrie</th><th className="pb-2.5">Drainage</th>
                  <th className="pb-2.5">Type de sol</th><th className="pb-2.5">Cours d'eau</th><th className="pb-2.5">Historique crues</th><th className="pb-2.5">MàJ</th>
                </tr>
              </thead>
              <tbody>
                {envZones.map((z) => (
                  <tr
                    key={z.name}
                    onClick={() => setSelectedZone(z.name)}
                    className={`border-b border-border-soft cursor-pointer hover:bg-app/60 ${z.name === selectedZone ? 'bg-brand/5' : ''}`}
                  >
                    <td className="py-2.5 font-semibold flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={z.name === selectedZone ? '#006A4E' : '#96A1B3'} strokeWidth="2.2"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.2" /></svg>
                      {z.name}
                    </td>
                    <td className="py-2.5 text-[12.5px]">{z.rain} mm</td>
                    <td className="py-2.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: drainSoft(z.drain), color: drainColor(z.drain) }}>{z.drain}%</span></td>
                    <td className="py-2.5 text-[12.5px] text-text-secondary">{z.soil}</td>
                    <td className="py-2.5 text-[12.5px] text-text-secondary">{z.river}</td>
                    <td className="py-2.5 text-[12px]">
                      <span className="inline-block w-14 h-1.5 rounded-full bg-border overflow-hidden align-middle mr-1.5">
                        <span className="block h-full rounded-full" style={{ width: `${z.hist}%`, background: z.hist >= 40 ? '#DC3B3B' : '#1E9E5A' }} />
                      </span>
                      {z.hist}%
                    </td>
                    <td className="py-2.5 text-[11.5px] text-text-tertiary">il y a 4 min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Capteurs de niveau d'eau (IoT)" subtitle="Déploiement prévu — phase 2 du projet">
            <div className="flex flex-col gap-2">
              {plannedSensors.map((s) => (
                <div key={s} className="flex items-center gap-2.5 text-[12px]">
                  <span className="w-2 h-2 rounded-full bg-border-soft border border-border flex-shrink-0" />
                  <span className="flex-1 text-text-secondary">{s}</span>
                  <span className="text-[10.5px] text-text-tertiary">Non déployé</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="État des flux de données" subtitle="Connexions actives vers les sources externes">
            <div className="flex flex-col gap-2.5">
              {dataFeeds.map((s) => {
                const sm = srcStatusMeta[s.status];
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: sm.soft, color: sm.color }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[17px] h-[17px]">
                        <path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2z" /><path d="M4 6v12c0 1.1 3.6 2 8 2s8-.9 8-2V6" /><path d="M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold">{s.name}</div>
                      <div className="text-[10.5px] text-text-tertiary">{s.meta} · {s.sync}</div>
                    </div>
                    <div className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: sm.soft, color: sm.color }}>{sm.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

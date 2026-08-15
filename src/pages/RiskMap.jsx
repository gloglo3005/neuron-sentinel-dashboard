import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopNav';
import { Card, RiskBadge, Btn, DataSourceBadge } from '../components/ui';
import ZoneMap from '../components/ZoneMap';
import Sparkline from '../components/charts/Sparkline';
import { levelOf, riskColor } from '../data/zones';
import { useZones } from '../hooks/useZones';
import { zonesService } from '../services/zonesService';
import { useSelectedZone } from '../context/SelectedZoneContext';

// Layer control panel — spec section 6. `key: null` layers have no real
// data source connected yet (signalements citoyens, infrastructures,
// interventions all depend on backend work not built in this pass) and are
// shown disabled rather than faked, per spec section 33.
const LAYERS = [
  { key: 'risk', label: 'Niveau de risque', always: true },
  { key: 'population', label: 'Population exposée' },
  { key: 'rain', label: 'Pluviométrie' },
  { key: null, label: 'Signalements citoyens' },
  { key: null, label: 'Infrastructures affectées' },
  { key: null, label: 'Interventions en cours' },
];

export default function RiskMap() {
  const navigate = useNavigate();
  const [horizonIdx, setHorizonIdx] = useState(0);
  const { selectedZone: selected, setSelectedZone: setSelected } = useSelectedZone();
  const [search, setSearch] = useState('');
  const [activeLayers, setActiveLayers] = useState(new Set(['risk', 'population']));
  const { zones, horizons, loading, source, refresh } = useZones();
  const showPop = activeLayers.has('population');
  const showRain = activeLayers.has('rain');
  const [syncingGeo, setSyncingGeo] = useState(false);
  const [geoResult, setGeoResult] = useState(null);

  async function handleSyncGeometry() {
    setSyncingGeo(true);
    setGeoResult(null);
    try {
      const r = await zonesService.syncGeometry();
      setGeoResult(r);
      refresh();
    } catch (err) {
      setGeoResult({ error: err.message || 'Une erreur est survenue.' });
    } finally {
      setSyncingGeo(false);
    }
  }

  function toggleLayer(key) {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  if (loading) {
    return (
      <div>
        <TopBar title="Carte des risques" />
        <div className="px-7 py-10 text-center text-text-tertiary text-[13px]">Chargement des données…</div>
      </div>
    );
  }

  const rows = Object.entries(zones)
    .filter(([name]) => !search || name.toLowerCase().includes(search.toLowerCase()))
    .map(([name, z]) => ({ name, val: z.series[horizonIdx], level: levelOf(z.series[horizonIdx]), pop: z.pop }))
    .sort((a, b) => b.val - a.val);

  const z = zones[selected];
  const level = z ? levelOf(z.series[horizonIdx]) : null;

  return (
    <div>
      <TopBar title="Carte des risques" />
      <div className="px-7 py-5 flex flex-col gap-4 pb-10">
        {/* Controls */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex gap-1.5 bg-surface-alt border border-border-soft rounded-lg p-1 w-fit">
              {horizons.map((h, i) => (
                <button
                  key={h}
                  onClick={() => setHorizonIdx(i)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                    i === horizonIdx ? 'bg-brand text-white' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher un quartier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 text-[12.5px] outline-none focus:border-brand w-[200px]"
              />
              <DataSourceBadge source={source} loading={loading} />
              <Btn onClick={handleSyncGeometry} disabled={syncingGeo} variant="ghost">
                {syncingGeo ? 'Synchronisation des contours…' : 'Synchroniser les contours (OSM)'}
              </Btn>
            </div>
          </div>
          {geoResult && (
            <div className={`mt-3 text-[12px] rounded-lg px-3 py-2 border ${geoResult.error ? 'text-risk-high bg-risk-high-soft border-risk-high/20' : 'text-risk-low bg-risk-low-soft border-risk-low/20'}`}>
              {geoResult.error
                ? geoResult.error
                : `${geoResult.updated}/${geoResult.total} contours mis à jour depuis OpenStreetMap.` +
                  (geoResult.errors?.length ? ` Échecs : ${geoResult.errors.join(', ')}` : '')}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
          {/* Map */}
          <Card
            title="Carte de risque — Lomé"
            subtitle={`Triés — ${horizons[horizonIdx]}`}
            right={
              <div className="flex flex-wrap gap-1.5 justify-end max-w-[420px]">
                {LAYERS.map((l) => {
                  const disabled = l.key === null;
                  const on = l.always || (l.key && activeLayers.has(l.key));
                  return (
                    <label
                      key={l.label}
                      title={disabled ? 'Aucune source de données connectée pour cette couche' : undefined}
                      className={`px-2.5 py-1 rounded-full text-[11px] border cursor-pointer select-none ${
                        disabled ? 'opacity-40 cursor-not-allowed border-border text-text-tertiary'
                        : on ? 'bg-brand-soft border-brand text-brand font-semibold' : 'border-border text-text-secondary'
                      }`}
                    >
                      <input type="checkbox" className="hidden" checked={on} disabled={disabled || l.always} onChange={() => l.key && toggleLayer(l.key)} />
                      {l.label}{disabled ? ' — bientôt' : ''}
                    </label>
                  );
                })}
              </div>
            }
          >
            <ZoneMap
              zones={zones}
              selectedZone={selected}
              onSelect={setSelected}
              horizonIdx={horizonIdx}
              showPopulation={showPop}
              showRain={showRain}
              filter={search}
              height={460}
              zoom={12}
            />
          </Card>

          {/* Zone list + detail */}
          <div className="flex flex-col gap-4">
            <Card title="Quartiers" subtitle={`${rows.length} résultat(s)`}>
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {rows.length === 0 && (
                  <div className="text-center text-[12px] text-text-tertiary py-5">Aucun quartier trouvé.</div>
                )}
                {rows.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setSelected(r.name)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      selected === r.name ? 'bg-brand-soft' : 'hover:bg-surface-alt'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: riskColor[r.level] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                      <div className="text-[10.5px] text-text-tertiary">≈ {r.pop.toLocaleString('fr-FR')} hab.</div>
                    </div>
                    <div className="text-[13px] font-bold" style={{ color: riskColor[r.level] }}>{r.val}%</div>
                  </button>
                ))}
              </div>
            </Card>

            {z && (
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13.5px] font-bold">{selected}</div>
                    <div className="mt-1.5"><RiskBadge level={level} value={z.series[horizonIdx]} /></div>
                  </div>
                </div>

                <div className="flex justify-between text-[11.5px] text-text-secondary py-1.5 border-b border-dashed border-border mt-3">
                  <span>Horizon</span><b className="text-text-primary font-semibold">{horizons[horizonIdx]}</b>
                </div>
                <div className="flex justify-between text-[11.5px] text-text-secondary py-1.5 border-b border-dashed border-border">
                  <span>Population estimée</span><b className="text-text-primary font-semibold">≈ {z.pop.toLocaleString('fr-FR')} hab.</b>
                </div>
                <div className="flex justify-between text-[11.5px] text-text-secondary py-1.5 border-b border-dashed border-border">
                  <span>Capacité de drainage</span><b className="text-text-primary font-semibold">{z.drain}%</b>
                </div>

                <div className="text-[11.5px] font-bold text-text-secondary mt-3 mb-1.5">Évolution du risque</div>
                <Sparkline series={z.series} activeIdx={horizonIdx} />

                <div className="text-[11.5px] font-bold text-text-secondary mt-3 mb-1.5">Facteurs pris en compte</div>
                {[
                  { label: 'Pluviométrie', val: z.rain, unit: 'mm', color: riskColor.high },
                  { label: 'Capacité drainage', val: z.drain, unit: '%', color: riskColor.low },
                  { label: 'Historique crues', val: z.hist, unit: '%', color: '#006A4E' },
                ].map((f) => (
                  <div key={f.label} className="mb-2">
                    <div className="flex justify-between text-[11px] mb-1"><span>{f.label}</span><b>{f.val}{f.unit}</b></div>
                    <div className="h-[5px] bg-border rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${f.val}%`, background: f.color }} /></div>
                  </div>
                ))}

                <div className="flex gap-2 mt-3">
                  <Btn variant="primary" className="flex-1 text-center" onClick={() => navigate('/alerts', { state: { presetZone: selected } })}>
                    Créer une alerte
                  </Btn>
                  <Btn variant="ghost" className="flex-1 text-center">Exporter</Btn>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

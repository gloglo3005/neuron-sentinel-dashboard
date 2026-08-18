import { useDataSource } from './useDataSource';
import { environmentalService } from '../services/environmentalService';
import { observedRain, forecastRain, forecast5, envZones, dataFeeds } from '../data/environmental';

export function useEnvironmentalData() {
  const { data, loading, error, source, refresh } = useDataSource(
    () => environmentalService.list(),
    () => ({ observedRain, forecastRain, forecast5, envZones, dataFeeds, weatherSource: null, weatherSyncedAt: null }),
    []
  );

  return {
    observedRain: data?.observedRain ?? [],
    forecastRain: data?.forecastRain ?? [],
    forecast5: data?.forecast5 ?? [],
    envZones: data?.envZones ?? [],
    dataFeeds: data?.dataFeeds ?? [],
    // Real per-row tag from the backend ('OpenWeatherMap' | 'MOCK' | null) —
    // see environmentalService.js. Distinct from `source` below: `source`
    // says whether the API call itself succeeded, `weatherSource` says
    // whether the weather feed behind it is the real OpenWeatherMap
    // integration or the server-side synthetic fallback.
    weatherSource: data?.weatherSource ?? null,
    weatherSyncedAt: data?.weatherSyncedAt ?? null,
    loading,
    error,
    source,
    refresh,
  };
}
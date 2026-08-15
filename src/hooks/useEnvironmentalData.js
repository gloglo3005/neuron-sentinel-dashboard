import { useDataSource } from './useDataSource';
import { environmentalService } from '../services/environmentalService';
import { observedRain, forecastRain, forecast5, envZones, dataFeeds } from '../data/environmental';

export function useEnvironmentalData() {
  const { data, loading, error, source, refresh } = useDataSource(
    () => environmentalService.list(),
    () => ({ observedRain, forecastRain, forecast5, envZones, dataFeeds }),
    []
  );

  return {
    observedRain: data?.observedRain ?? [],
    forecastRain: data?.forecastRain ?? [],
    forecast5: data?.forecast5 ?? [],
    envZones: data?.envZones ?? [],
    dataFeeds: data?.dataFeeds ?? [],
    loading,
    error,
    source,
    refresh,
  };
}

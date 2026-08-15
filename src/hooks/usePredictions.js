import { useDataSource } from './useDataSource';
import { predictionsService } from '../services/predictionsService';
import { zoneExplain, confidenceSeries, accuracySeries, trendDays } from '../data/aiPredictions';

export function usePredictions() {
  const { data, loading, error, source, refresh } = useDataSource(
    () => predictionsService.list(),
    () => ({ zoneExplain, confidenceSeries, accuracySeries, trendDays }),
    []
  );

  return {
    zoneExplain: data?.zoneExplain ?? {},
    confidenceSeries: data?.confidenceSeries ?? [],
    accuracySeries: data?.accuracySeries ?? [],
    trendDays: data?.trendDays ?? [],
    loading,
    error,
    source,
    refresh,
  };
}

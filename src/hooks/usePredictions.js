import { useDataSource } from './useDataSource';
import { predictionsService } from '../services/predictionsService';
import { zoneExplain, confidenceSeries, accuracySeries, trendDays } from '../data/aiPredictions';

export function usePredictions() {
  const { data, loading, error, source, refresh } = useDataSource(
    () => predictionsService.list(),
    () => ({ zoneExplain, confidenceSeries, accuracySeries, trendDays, modelSource: 'MOCK', latestGeneratedAt: null }),
    []
  );

  return {
    zoneExplain: data?.zoneExplain ?? {},
    confidenceSeries: data?.confidenceSeries ?? [],
    accuracySeries: data?.accuracySeries ?? [],
    trendDays: data?.trendDays ?? [],
    // 'MOCK' | 'REMOTE' | null — which AI actually produced the most
    // recent prediction (see predictionsService.js). Independent of
    // `source`: `source` says whether GET /api/predictions itself
    // succeeded, `modelSource` says whether the predictions it returned
    // came from the transparent internal scorer or the teammate's model.
    modelSource: data?.modelSource ?? null,
    latestGeneratedAt: data?.latestGeneratedAt ?? null,
    loading,
    error,
    source,
    refresh,
  };
}
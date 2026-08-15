import { useDataSource } from './useDataSource';
import { reportsService } from '../services/reportsService';
import { initialReports, monthlyTrend } from '../data/reports';

export function useReports() {
  const { data, loading, error, source, setData, refresh } = useDataSource(
    () => reportsService.list(),
    () => ({ reports: initialReports, monthlyTrend }),
    []
  );

  return {
    reports: data?.reports ?? [],
    setReports: (updater) =>
      setData((prev) => ({
        ...prev,
        reports: typeof updater === 'function' ? updater(prev?.reports ?? []) : updater,
      })),
    monthlyTrend: data?.monthlyTrend ?? { months: [], values: [] },
    loading,
    error,
    source,
    refresh,
  };
}

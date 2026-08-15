import { useDataSource } from './useDataSource';
import { zonesService } from '../services/zonesService';
import { zones as mockZones, zoneNames as mockZoneNames, horizons } from '../data/zones';

export function useZones() {
  const { data, loading, error, source, refresh } = useDataSource(
    () => zonesService.list(),
    () => ({ zones: mockZones, zoneNames: mockZoneNames }),
    []
  );

  return {
    zones: data?.zones ?? {},
    zoneNames: data?.zoneNames ?? [],
    horizons, // display horizons are a frontend concern, not fetched
    loading,
    error,
    source, // 'real' | 'mock'
    refresh,
  };
}

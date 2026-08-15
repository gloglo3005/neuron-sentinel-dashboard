import { useCallback, useEffect, useState } from 'react';

/**
 * Generic "API with mock fallback" hook.
 *
 * - Calls `fetcher()` (hits the real backend via a services/* module).
 * - If it throws (backend not configured, unreachable, or erroring — see
 *   src/api/client.js) it transparently falls back to `mockFactory()`,
 *   which returns the demo data bundled in src/data/.
 * - Exposes which one is currently active as `source` ('real' | 'mock') so
 *   pages can show a transparent MOCK / REAL DATA indicator instead of
 *   silently pretending demo data is live.
 *
 * Pages should never import src/data/* directly — go through a hook in
 * this folder instead, so swapping mock -> real API never requires
 * touching page code again once the backend exists.
 */
export function useDataSource(fetcher, mockFactory, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, source: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null, source: 'real' });
    } catch (err) {
      // Backend absent/unreachable in dev — use the bundled demo dataset.
      setState({ data: mockFactory(), loading: false, error: err, source: 'mock' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  const setData = useCallback((updater) => {
    setState((s) => ({
      ...s,
      data: typeof updater === 'function' ? updater(s.data) : updater,
    }));
  }, []);

  return { ...state, setData, refresh: load };
}

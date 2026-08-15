import { createContext, useContext, useState, useMemo } from 'react';

// A single piece of shared state — which zone is currently "focused" —
// visible to every page instead of each one keeping its own local
// useState('Baguida'). Same pattern as AuthContext: a Provider wraps the
// app once in main.jsx, and any page reads/writes it via useSelectedZone().
//
// Deliberately just a name string (matches how zones are keyed everywhere
// else — src/data/zones.js, alertsService, etc.) rather than a full zone
// object, so it stays valid across pages even if their zone datasets load
// at slightly different times.
const SelectedZoneContext = createContext(null);

export function SelectedZoneProvider({ children, initialZone = 'Baguida' }) {
  const [selectedZone, setSelectedZone] = useState(initialZone);
  const value = useMemo(() => ({ selectedZone, setSelectedZone }), [selectedZone]);
  return <SelectedZoneContext.Provider value={value}>{children}</SelectedZoneContext.Provider>;
}

export function useSelectedZone() {
  const ctx = useContext(SelectedZoneContext);
  if (!ctx) throw new Error('useSelectedZone must be used within a SelectedZoneProvider');
  return ctx;
}

import { Routes, Route, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RiskMap from './pages/RiskMap';
import Alerts from './pages/Alerts';
import AIPredictions from './pages/AIPredictions';
import EnvironmentalData from './pages/EnvironmentalData';
import Reports from './pages/Reports';
import { useAuth } from './context/AuthContext';

// This whole app is a single authenticated authority dashboard (see
// backend/src/routes/index.js — every route but /api/auth/login requires a
// session), so the auth gate lives here at the top rather than per-route.
export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <div className="text-[13px] text-text-tertiary">Chargement…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/risk-map" element={<RiskMap />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/ai-predictions" element={<AIPredictions />} />
        <Route path="/environmental-data" element={<EnvironmentalData />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

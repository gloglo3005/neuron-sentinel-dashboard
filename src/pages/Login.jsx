import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// POST /api/auth/login — the sole public endpoint on this API (see
// backend/src/routes/index.js). Everything else requires the JWT this
// screen obtains. Only CIVIL_PROTECTION / AUTHORITY / EMERGENCY_SERVICE
// accounts are accepted here; ADMIN/CITIZEN are rejected server-side even
// with a correct password.
export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      // On success, AuthContext flips isAuthenticated -> App.jsx swaps to
      // the dashboard automatically; no navigate() needed here.
    } catch (err) {
      // err.message is already the backend's own French message when the
      // API responded (invalid creds, locked account, rate limited). When
      // the backend itself is unreachable/unconfigured (status 0), give a
      // clearer hint than the raw fetch error.
      setError(
        err?.status === 0
          ? "Impossible de joindre le serveur. Vérifiez que le backend est démarré et que VITE_API_BASE_URL est configuré."
          : err?.message || 'Une erreur est survenue.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center gap-2.5 mb-7">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center font-display font-extrabold text-[16px] text-white"
            style={{ background: 'linear-gradient(135deg, #006A4E, #12B888)' }}
          >
            NS
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-[17px] text-text-primary">Neuron Sentinel</div>
            <div className="text-[12px] text-text-tertiary">Flood Early Warning — Tableau de bord autorités</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl2 shadow-card p-7 flex flex-col gap-4"
        >
          <div>
            <h1 className="text-[15px] font-bold text-text-primary">Connexion</h1>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Réservé aux comptes ANPC, Mairie et services d'urgence.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-secondary">Téléphone ou e-mail</span>
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+228 90 00 00 02"
              required
              className="px-3 py-2.5 rounded-lg border border-border bg-surface text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-secondary">Mot de passe</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="px-3 py-2.5 rounded-lg border border-border bg-surface text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          {error && (
            <div className="text-[12px] text-risk-high bg-risk-high-soft border border-risk-high/20 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-[11px] text-text-tertiary mt-4">
          Accès non autorisé pour le grand public — comptes provisionnés par un administrateur.
        </p>
      </div>
    </div>
  );
}

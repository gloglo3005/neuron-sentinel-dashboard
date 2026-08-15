import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { ApiError } from '../api/client';
import { connectSocket, disconnectSocket } from '../realtime/socket';

// Real authentication against the Neuron Sentinel backend (POST /api/auth/login).
// - The JWT is kept in localStorage ('ns_token') so a page refresh doesn't
//   log the user out — on mount we validate it against GET /api/auth/me
//   rather than trusting it blindly (it may have expired or been revoked
//   server-side, e.g. the account got locked or deactivated).
// - `loading` covers that initial validation round-trip so App.jsx can show
//   a splash instead of flashing the login screen for an already-logged-in
//   user.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('ns_token') : null
  );
  const [loading, setLoading] = useState(true);

  // On mount (and on any full page reload), if a token is already stored,
  // confirm it's still valid and fetch the current user before rendering
  // the dashboard.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await authService.me();
        if (!cancelled) {
          setUser(me);
          connectSocket();
        }
      } catch {
        // Token expired/invalid/backend unreachable — fall back to logged-out.
        if (!cancelled) {
          setToken(null);
          if (typeof localStorage !== 'undefined') localStorage.removeItem('ns_token');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
    // Only run once on mount — token changes from login()/logout() below
    // manage their own state directly and shouldn't re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (identifier, password) => {
    // Let ApiError propagate — the login page reads err.message (already
    // the backend's own French message, e.g. compte verrouillé, trop de
    // tentatives, identifiants invalides) to show inline.
    const result = await authService.login(identifier, password);
    setUser(result.user);
    setToken(result.token);
    if (typeof localStorage !== 'undefined') localStorage.setItem('ns_token', result.token);
    connectSocket();
    return result.user;
  }, []);

  const logout = useCallback(() => {
    // Best-effort — the JWT is stateless server-side, so this only feeds
    // the audit log. We clear local session regardless of whether it
    // succeeds (e.g. token already expired).
    authService.logout().catch(() => {});
    disconnectSocket();
    setUser(null);
    setToken(null);
    if (typeof localStorage !== 'undefined') localStorage.removeItem('ns_token');
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, isAuthenticated: !!user }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };

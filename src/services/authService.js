import { apiFetch } from '../api/client';

// Authority login (identifier + password, see spec section 24). Not wired
// to a login screen yet — AuthContext currently seeds a dev user so the
// existing dashboard keeps working unchanged. This service is ready for
// when the login page ships (priority 3).
export const authService = {
  login: (identifier, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  me: () => apiFetch('/auth/me'),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
};

// Thin fetch wrapper around the future Neuron Sentinel backend
// (Node/Express + Prisma + PostgreSQL — see backend/README.md).
//
// VITE_API_BASE_URL is intentionally unset in development until the backend
// exists. When it's unset, apiFetch() rejects immediately so callers (the
// hooks in src/hooks/) can fall back to the bundled mock data in src/data/
// without ever hitting the network. Once a real backend is deployed, just
// set VITE_API_BASE_URL (see .env.example) — no other code needs to change.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function authHeaders() {
  if (typeof localStorage === 'undefined') return {};
  const token = localStorage.getItem('ns_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Call the Neuron Sentinel REST API.
 * Throws ApiError on network failure, non-2xx response, or when no backend
 * is configured yet (status 0) — callers should catch and fall back to mocks.
 */
export async function apiFetch(path, options = {}) {
  if (!BASE_URL) {
    throw new ApiError('API non configurée (VITE_API_BASE_URL absent) — utilisation des données de démonstration.', 0);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError(`Backend injoignable (${err.message})`, 0);
  }

  if (!res.ok) {
    let message = `Erreur API (${res.status})`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export { BASE_URL };

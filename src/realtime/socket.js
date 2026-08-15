import { io } from 'socket.io-client';
import { BASE_URL } from '../api/client';

// Backend emits (no auth check on the socket itself, no per-user rooms —
// see backend/src/realtime/io.js): alert.created, alert.updated,
// alert.dispatched, incident.created, intervention.updated,
// prediction.updated. Only the alert.* events are consumed today.
//
// Single lazy-connected socket for the whole app — connected once a
// session exists (see AuthContext), disconnected on logout. If
// VITE_API_BASE_URL isn't set at all (pure mock mode), we never connect —
// there's nothing real to listen to.

const SOCKET_URL = BASE_URL ? BASE_URL.replace(/\/api\/?$/, '') : null;

let socket = null;

export function connectSocket() {
  if (!SOCKET_URL || socket) return socket;
  socket = io(SOCKET_URL, { autoConnect: true, reconnection: true });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// Subscribes `handler` to `event` on the shared socket, connecting it
// first if needed. Returns an unsubscribe function safe to call from a
// useEffect cleanup even if the socket was never created (mock mode).
export function onSocketEvent(event, handler) {
  const s = connectSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}
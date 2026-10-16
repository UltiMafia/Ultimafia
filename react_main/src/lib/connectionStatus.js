// Application-level connection status, shared by every live socket so the
// shell can show one indicator no matter which connection is unhealthy. This
// is a small external store rather than React state because the sockets live
// inside the game and chat trees, below the shell that needs to read it.
//
// Status values:
//   "idle"         no socket is open or expected
//   "live"         every registered socket is open
//   "connecting"   a socket exists but has not opened yet
//   "reconnecting" a socket closed and has not reopened
//   "offline"      the browser itself reports no network

const listeners = new Set();
const socketStates = new Map();
let browserOnline = true;

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeConnectionStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registerSocket(id) {
  socketStates.set(id, "connecting");
  emit();
}

export function unregisterSocket(id) {
  if (socketStates.delete(id)) emit();
}

export function setSocketState(id, state) {
  if (!socketStates.has(id) || socketStates.get(id) === state) return;
  socketStates.set(id, state);
  emit();
}

export function getConnectionStatus() {
  if (!browserOnline) return "offline";

  const states = [...socketStates.values()];
  if (!states.length) return "idle";
  if (states.includes("closed")) return "reconnecting";
  if (states.includes("connecting")) return "connecting";
  return "live";
}

if (typeof window !== "undefined") {
  browserOnline = window.navigator.onLine !== false;
  window.addEventListener("online", () => {
    browserOnline = true;
    emit();
  });
  window.addEventListener("offline", () => {
    browserOnline = false;
    emit();
  });
}

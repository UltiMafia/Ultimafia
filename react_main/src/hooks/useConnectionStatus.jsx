import { useEffect, useState } from "react";
import {
  getConnectionStatus,
  subscribeConnectionStatus,
} from "../lib/connectionStatus";

// Subscribes a component to the shared connection status. React 17 has no
// useSyncExternalStore, so this is a plain subscription.
export function useConnectionStatus() {
  const [status, setStatus] = useState(getConnectionStatus);

  useEffect(
    () => subscribeConnectionStatus(() => setStatus(getConnectionStatus())),
    []
  );

  return status;
}

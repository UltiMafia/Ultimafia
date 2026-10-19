import React from "react";
import { Alert } from "@mui/material";

import { useConnectionStatus } from "../hooks/useConnectionStatus";

// Only unambiguous, non-flapping states show a banner. A transient "connecting"
// or a socket that closes during ordinary navigation must not flash anything.
const MESSAGES = {
  offline: "You are offline. The game will catch up when you reconnect.",
};

// App-level connection state, shown above everything. Rendered by the shell so
// it is visible on every page, not only inside the game.
export function ConnectionBanner() {
  const status = useConnectionStatus();
  const message = MESSAGES[status];

  if (!message) return null;

  return (
    <Alert
      severity="error"
      className="connection-banner"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1500,
        justifyContent: "center",
        borderRadius: 0,
      }}
    >
      {message}
    </Alert>
  );
}

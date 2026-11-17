import React, { useState } from "react";
import { Alert } from "@mui/material";

const DISMISSED_KEY = "remoteBackendBannerDismissed";

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "true";
  } catch (e) {
    return false;
  }
}

// Shown only when the dev server proxies a live site's backend (see
// REACT_APP_REMOTE_BACKEND and docs/setup-remote-backend.md), so a development
// client can never be mistaken for the local sandbox.
export function RemoteBackendBanner() {
  const backend = import.meta.env.REACT_APP_REMOTE_BACKEND;
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!backend || dismissed) return null;

  let host = backend;
  try {
    host = new URL(backend).host;
  } catch (e) {
    // Keep the raw value if it is not a full URL.
  }

  const onClose = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch (e) {
      // Dismissing is only cosmetic; storage may be unavailable.
    }
  };

  return (
    <Alert
      severity="warning"
      className="remote-backend-banner"
      onClose={onClose}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1499,
        justifyContent: "center",
        borderRadius: 0,
        py: 0,
      }}
    >
      Development client connected to {host}. Actions here are real.
    </Alert>
  );
}

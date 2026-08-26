import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

import {
  canRequestPush,
  getPermission,
  isIos,
  isPushSupported,
  isStandalone,
  subscribeToPush,
} from "utils/pushNotifications";

/**
 * Offers push notifications while a player waits in pregame, so they can put the
 * phone down and still be told when the game fills.
 *
 * Only rendered during pregame. The subscription is handed to the game server
 * over the game socket and is dropped again when the player leaves or the game
 * starts, so nothing outlives the wait it exists for.
 */
export default function PushNotificationPrompt({ socket }) {
  const [dismissed, setDismissed] = useState(false);
  const [permission, setPermission] = useState(() =>
    isPushSupported() ? getPermission() : "denied"
  );
  const sentEndpointRef = useRef(null);

  const sendSubscription = useCallback(
    async () => {
      if (!socket || !socket.send) return false;

      const subscription = await subscribeToPush();
      if (!subscription) return false;

      // The socket can drop and reconnect during a long pregame; re-sending the
      // same endpoint is harmless (the server keys on it) but pointless.
      if (sentEndpointRef.current === subscription.endpoint) return true;

      socket.send("pushSubscribe", subscription);
      sentEndpointRef.current = subscription.endpoint;
      return true;
    },
    [socket]
  );

  // Permission already granted from a previous game: re-register with the server
  // silently. No user gesture is needed once permission exists.
  useEffect(() => {
    if (!canRequestPush()) return;
    if (getPermission() !== "granted") return;

    let cancelled = false;
    sendSubscription().then((ok) => {
      if (!cancelled && ok) setPermission("granted");
    });

    return () => {
      cancelled = true;
    };
  }, [sendSubscription]);

  async function onEnableClick() {
    // Must stay inside the click handler: iOS Safari only honours
    // Notification.requestPermission() during user activation.
    const ok = await sendSubscription();
    setPermission(ok ? "granted" : getPermission());
    if (!ok) setDismissed(true);
  }

  if (dismissed || !isPushSupported()) return null;

  // iOS only delivers web push to an installed PWA, so in a plain Safari tab the
  // useful thing to say is "add this to your home screen", not "allow".
  if (isIos() && !isStandalone()) {
    return (
      <Snackbar
        open
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ maxWidth: 420 }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setDismissed(true)}
        >
          Add UltiMafia to your home screen (Share &rarr; Add to Home Screen) to
          get notified when your game starts.
        </Alert>
      </Snackbar>
    );
  }

  if (permission !== "default") return null;

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ maxWidth: 420 }}
    >
      <Alert
        severity="info"
        variant="filled"
        onClose={() => setDismissed(true)}
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<NotificationsActiveIcon />}
            onClick={onEnableClick}
          >
            Notify me
          </Button>
        }
      >
        Get a notification when this game starts.
      </Alert>
    </Snackbar>
  );
}

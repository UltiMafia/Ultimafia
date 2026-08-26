import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, IconButton, Snackbar, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
 * This is the only place the site asks for notification permission. Asking on
 * page load instead (as the game page used to) prompts with no context, and
 * Chrome's quieter-permissions heuristic auto-blocks sites that do it for anyone
 * with a history of dismissing prompts -- which loses the permission for people
 * who would have said yes when asked in context.
 */

const DISMISSED_KEY = "pushPromptDismissed";

// Dismissal is remembered for the session, not forever. Re-asking in every lobby
// would be nagging, but since this banner is the only way to turn notifications
// on, a permanent record would mean one stray tap costs the feature for good with
// no way back short of clearing site data.
function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch (e) {
    // Private mode / blocked storage: just show it.
    return false;
  }
}

function rememberDismissed() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch (e) {
    // Not being able to remember is not worth failing over.
  }
}

export default function PushNotificationPrompt({ socket }) {
  const [hidden, setHidden] = useState(() => wasDismissed());
  const [permission, setPermission] = useState(() =>
    isPushSupported() ? getPermission() : "denied"
  );
  const sentEndpointRef = useRef(null);

  const sendSubscription = useCallback(async () => {
    if (!socket || !socket.send) return false;

    const subscription = await subscribeToPush();
    if (!subscription) return false;

    // The socket can drop and reconnect during a long pregame; re-sending the
    // same endpoint is harmless (the server keys on it) but pointless.
    if (sentEndpointRef.current === subscription.endpoint) return true;

    socket.send("pushSubscribe", subscription);
    sentEndpointRef.current = subscription.endpoint;
    return true;
  }, [socket]);

  // Permission already granted -- from an earlier game, or from browser settings
  // -- so register with the server silently. No gesture is needed once permission
  // exists, and this is what makes rejoining a lobby not ask again.
  useEffect(() => {
    if (!canRequestPush()) return;
    if (permission !== "granted") return;

    let cancelled = false;
    sendSubscription().then((ok) => {
      // Nothing to show either way: granted means no prompt is needed, and a
      // failure here is the server being unconfigured, not the user's problem.
      if (!cancelled && ok) setHidden(true);
    });

    return () => {
      cancelled = true;
    };
  }, [permission, sendSubscription]);

  async function onEnableClick() {
    // Must stay inside the click handler: Safari (and Firefox) only honour
    // Notification.requestPermission() while the document has user activation.
    const ok = await sendSubscription();

    if (ok) {
      setPermission("granted");
      setHidden(true);
      return;
    }

    // Denied, or push is unavailable. Either way there is nothing more to offer,
    // so drop the banner -- but do not persist it, since a transient failure
    // (server unconfigured, socket not ready) should not suppress it forever.
    setPermission(getPermission());
    setHidden(true);
  }

  function onDismiss() {
    rememberDismissed();
    setHidden(true);
  }

  if (hidden || !isPushSupported()) return null;
  if (permission === "denied") return null;

  const closeButton = (
    <IconButton
      size="small"
      color="inherit"
      aria-label="Dismiss"
      onClick={onDismiss}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  // NB: MUI's Alert renders its built-in close button only when `action` is
  // absent, so anything with an action has to supply its own.
  function banner(message, action) {
    return (
      <Snackbar
        open
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ maxWidth: 460 }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Stack direction="row" spacing={0.5} alignItems="center">
              {action}
              {closeButton}
            </Stack>
          }
        >
          {message}
        </Alert>
      </Snackbar>
    );
  }

  // iOS only delivers web push to an installed PWA, so in a plain Safari tab the
  // useful thing to say is "add this to your home screen", not "allow".
  if (isIos() && !isStandalone()) {
    return banner(
      <>
        Add UltiMafia to your home screen (Share &rarr; Add to Home Screen) to get
        notified when your game starts.
      </>,
      null
    );
  }

  if (permission !== "default") return null;

  return banner(
    "Get a notification when this game starts.",
    <Button
      color="inherit"
      size="small"
      startIcon={<NotificationsActiveIcon />}
      onClick={onEnableClick}
    >
      Notify me
    </Button>
  );
}

/**
 * Service worker for push notifications and PWA installability.
 *
 * There is deliberately NO `fetch` handler here. The site has never shipped a
 * service worker, so adding one that caches would put a new layer between users
 * and every deploy -- stale bundles, hard-to-reproduce bug reports, and users
 * stuck on an old build until they clear site data. This worker exists solely so
 * the browser has somewhere to deliver pushes and so the app is installable.
 * If offline caching is ever wanted it should be a separate, deliberate change.
 */

self.addEventListener("install", () => {
  // Take over immediately rather than waiting for every tab to close, so a
  // deployed fix to this file reaches users on their next visit.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_NOTIFICATION = {
  title: "UltiMafia",
  body: "Your game is ready.",
  url: "/",
};

function parsePushData(event) {
  if (!event.data) return DEFAULT_NOTIFICATION;

  try {
    return { ...DEFAULT_NOTIFICATION, ...event.data.json() };
  } catch (e) {
    // A push service (or a test) may deliver a plain string.
    return { ...DEFAULT_NOTIFICATION, body: event.data.text() };
  }
}

async function hasFocusedClient() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  // Deliberately `focused` and not `visibilityState`: a tab can be visible while
  // its window sits behind another one, and that player still wants telling.
  // This is the same test the in-page notification used (document.hasFocus()),
  // which is what makes the two paths add up to exactly one notification.
  return clients.some((client) => client.focused);
}

self.addEventListener("push", (event) => {
  const payload = parsePushData(event);

  event.waitUntil(
    (async () => {
      // Someone staring at the ready-check dialog does not also need a system
      // notification; the page already has the dialog, the urgency overlay and
      // the audio cue.
      //
      // The subscription is userVisibleOnly, which in principle obliges us to
      // show something for every push. Skipping while the player is looking
      // right at the tab is well within what browsers tolerate -- enforcement
      // targets sites that never show anything -- and in the case this feature
      // exists for (phone locked, app backgrounded) nothing is focused and the
      // notification is always shown.
      if (await hasFocusedClient()) return;

      await showGameNotification(payload);
    })()
  );
});

function showGameNotification(payload) {
  return self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    // Same tag per game, so a ready-check push followed by a starting push
    // replaces rather than stacks.
    tag: payload.tag || "ultimafia",
    renotify: true,
    requireInteraction: false,
    data: { url: payload.url || DEFAULT_NOTIFICATION.url },
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || DEFAULT_NOTIFICATION.url;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const targetPath = new URL(targetUrl, self.location.origin).pathname;

      // Prefer an existing tab. Reuse one already on the game before falling back
      // to any open tab, so tapping the notification does not pile up windows.
      const onTarget = allClients.find(
        (client) => new URL(client.url).pathname === targetPath
      );

      if (onTarget) return onTarget.focus();

      const anyClient = allClients[0];
      if (anyClient && "navigate" in anyClient) {
        await anyClient.focus();
        return anyClient.navigate(targetUrl);
      }

      return self.clients.openWindow(targetUrl);
    })()
  );
});

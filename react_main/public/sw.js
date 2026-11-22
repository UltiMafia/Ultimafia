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

// Payload contract, shared with modules/pushNotifications.js:
//
//   { kind, gameId, url, title, body, tag, state?, timestamp? }
//
// `kind` is one of "ready-check", "game-starting" or "kicks-reminder". It does
// not change how the notification looks -- the copy comes from the server -- it
// only decides where a click lands. A payload without `kind` is an older one and
// keeps the pre-kicks behaviour exactly.
const KIND_KICKS_REMINDER = "kicks-reminder";

// Phone layouts open on the chat panel and keep the meeting forms on the Actions
// tab (Game.jsx `selectedPanel`), so a reminder that the player still owes an
// action is wasted if the tap drops them in chat. The game page reads this once
// on mount (src/pages/Game/pushDeepLink.js) and the player can switch panels
// afterwards.
const PANEL_PARAM = "panel";
const KICKS_PANEL = "actions";

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

function parseUrl(url) {
  try {
    return new URL(url, self.location.origin);
  } catch (e) {
    return new URL(DEFAULT_NOTIFICATION.url, self.location.origin);
  }
}

/**
 * The game id in a pathname, using the same `/game/:gameId` prefix rule the
 * client routes on (src/hooks/useHostedGameSession.jsx).
 */
function gameIdFromPathname(pathname) {
  const match = /^\/game\/([^/]+)(?:\/|$)/.exec(pathname || "");
  return match ? match[1] : null;
}

/**
 * Absolute URL a click should open.
 *
 * Every kind goes to the game named by the payload. A kicks reminder also asks
 * for the action panel: landing in chat is the one outcome that would waste it.
 */
function clickUrl(data) {
  const raw =
    data.url || (data.gameId ? `/game/${data.gameId}` : DEFAULT_NOTIFICATION.url);
  const url = parseUrl(raw);

  if (
    data.kind === KIND_KICKS_REMINDER &&
    gameIdFromPathname(url.pathname) &&
    !url.searchParams.has(PANEL_PARAM)
  ) {
    url.searchParams.set(PANEL_PARAM, KICKS_PANEL);
  }

  return url.href;
}

/**
 * `focus()` rejects when the browser does not consider the window focusable
 * (it demands user activation, which a real notification click carries but a
 * synthetic one does not). Raising the window is a nicety: losing it must not
 * cost the player the deep link, so the client is still returned.
 */
async function focusSafely(client) {
  try {
    return (await client.focus()) || client;
  } catch (e) {
    return client;
  }
}

function showGameNotification(payload) {
  const options = {
    body: payload.body,
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    // One live notification per game: a ready-check push, then a starting push,
    // then a kicks reminder for the same game replace each other instead of
    // stacking, and `renotify` makes the replacement alert again rather than
    // silently swapping the text. Neither kind pins itself to the screen -- a
    // "your action is due" that outlived the kicks window would be stale -- so
    // `requireInteraction` stays false for every kind.
    tag: payload.tag || "ultimafia",
    renotify: true,
    requireInteraction: false,
    data: {
      // Resolved once, so `data.url` is always the URL a click should open even
      // when the payload only names a game.
      url: clickUrl(payload),
      kind: payload.kind || null,
      gameId:
        payload.gameId ||
        gameIdFromPathname(parseUrl(payload.url || "").pathname) ||
        null,
    },
  };

  const timestamp = Number(payload.timestamp);
  if (Number.isFinite(timestamp) && timestamp > 0) options.timestamp = timestamp;

  return self.registration.showNotification(payload.title, options);
}

self.addEventListener("push", (event) => {
  const payload = parsePushData(event);

  event.waitUntil(
    (async () => {
      // Someone staring at the ready-check dialog does not also need a system
      // notification; the page already has the dialog, the urgency overlay and
      // the audio cue. Same for a player who is looking at the game when kicks
      // start.
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = clickUrl(data);
  const target = parseUrl(targetUrl);
  const targetGameId = data.gameId || gameIdFromPathname(target.pathname);

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Prefer a tab that is already in this game, wherever in the game it is:
      // tapping the notification must not reload the game the player is in the
      // middle of (a reload reconnects the socket and drops them back to
      // loading). When the payload names no game, fall back to an exact path
      // match, which is what this handler did before kinds existed.
      const onGame = targetGameId
        ? allClients.find(
            (client) =>
              gameIdFromPathname(parseUrl(client.url).pathname) === targetGameId
          )
        : allClients.find(
            (client) => parseUrl(client.url).pathname === target.pathname
          );

      if (onGame) {
        const focused = await focusSafely(onGame);

        // The panel is page state, not part of a live game's URL, so it is sent
        // as a message rather than by navigating.
        if (
          target.searchParams.has(PANEL_PARAM) &&
          typeof focused.postMessage === "function"
        ) {
          focused.postMessage({
            type: "push-deep-link",
            kind: data.kind || null,
            gameId: targetGameId,
            panel: target.searchParams.get(PANEL_PARAM),
          });
        }

        return focused;
      }

      // Nothing in this game: reuse whatever window is open rather than piling
      // up a second one, and only open a new window when the app is closed.
      const anyClient = allClients[0];
      if (anyClient && "navigate" in anyClient) {
        await focusSafely(anyClient);
        return anyClient.navigate(targetUrl);
      }

      return self.clients.openWindow(targetUrl);
    })()
  );
});

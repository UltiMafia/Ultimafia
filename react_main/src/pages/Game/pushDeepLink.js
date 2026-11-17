/**
 * Panel hints that arrive with a push-notification click.
 *
 * public/sw.js sends a kicks reminder to `/game/<id>?panel=actions` because the
 * phone layout opens on chat and keeps the meeting forms on the Actions tab. It
 * also messages an already-open game instead of navigating (which would reload
 * the game and reconnect the socket), so both routes end up here.
 *
 * The parameter is applied once when the game page mounts: a player who switches
 * to chat afterwards keeps that choice, and the game's URL sync drops the
 * parameter again on the next navigation.
 */

export const PUSH_DEEP_LINK_PANEL_PARAM = "panel";

// The values MobileLayout uses for its bottom navigation. Anything else is
// ignored, because an unknown value would select a panel that is not rendered
// and leave the player looking at an empty game.
const PANELS = new Set(["chat", "players", "actions", "info", "menu"]);

function knownPanel(value) {
  return PANELS.has(value) ? value : null;
}

/** Panel requested by a join/search string such as "?panel=actions". */
export function pushDeepLinkPanel(search) {
  if (!search) return null;

  try {
    return knownPanel(new URLSearchParams(search).get(PUSH_DEEP_LINK_PANEL_PARAM));
  } catch (e) {
    // A malformed search string is not worth failing a game load over.
    return null;
  }
}

/**
 * Panel requested by a `{type: "push-deep-link"}` message from the service
 * worker. Only messages for the game this page is showing are honoured; the
 * worker sends to the tab that already has that game, so the id is a guard
 * against a stale or stray message rather than a real routing decision.
 */
export function pushDeepLinkPanelFromMessage(data, gameId) {
  if (!data || data.type !== "push-deep-link") return null;
  if (!gameId || data.gameId !== gameId) return null;

  return knownPanel(data.panel);
}

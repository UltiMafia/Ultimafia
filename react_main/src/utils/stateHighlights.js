// Chronological highlight lines for one history state, used by the desktop
// state switcher tooltip.
//
// A state records its own instant events (actions resolved during it, under an
// `instant-<time>` obituary source) and its public alerts. Deaths that resolve
// at the end of a state are announced at the start of the next one under the
// finished phase's name (Night/Day/Postgame); those belong to the state that
// just ended.
//
// Nothing is inferred from votes or from the wording of a death message: a
// condemnation is whatever the game actually recorded as dead, in the order the
// game recorded it.

const EMOTE = /:[a-zA-Z0-9_+-]+:/g;
const GUN_ALERT = /:gun/;
const INSTANT_SOURCE = /^instant-/;
const LEADING_SEPARATOR = /^[\s:,-]+/;

export function stripEmotes(text) {
  return String(text || "")
    .replace(EMOTE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roleIn(state, playerId) {
  const roles = (state && state.roles) || {};
  const value = roles[playerId];

  if (typeof value !== "string" || !value) return null;

  const [name, modifier] = value.split(":");
  if (!name) return null;

  return modifier ? `${name} (${modifier})` : name;
}

// The recorded message without the player's name, so the row can show the name
// once and keep the rest short enough to scan. A custom message may not contain
// the name at all, in which case the whole message is the detail.
function deathDetail(name, message) {
  const text = String(message || "").trim();
  if (!text) return "";

  if (!text.startsWith(name)) return text;

  return text.slice(name.length).replace(LEADING_SEPARATOR, "").trim();
}

function obituaryGroups(state) {
  const bySource = (state && state.obituaries) || {};

  return Object.keys(bySource).map((source) => {
    const message = bySource[source] || {};

    return {
      source,
      time: Number(message.time) || 0,
      deaths: (message.obituaries || []).map((entry) => {
        const snippets = entry.snippets || {};
        const name =
          (entry.playerInfo && entry.playerInfo.name) || "Unknown player";

        return {
          id: entry.id,
          name,
          detail: deathDetail(name, stripEmotes(snippets.deathMessage)),
          role: roleIn(state, entry.id),
        };
      }),
    };
  });
}

function nextState(states, stateNum) {
  if (stateNum === -2) return null;

  if (states[stateNum + 1]) return states[stateNum + 1];

  // A game that ends on a state's actions announces them in postgame.
  if (stateNum >= 0 && states[-2]) return states[-2];

  return null;
}

// A shot alert names its target ("... shoots at Alice!"). Used only to keep the
// death after the shot that announced it; the recorded timestamps do not always
// reflect firing order because alerts and obituaries are queued separately.
function mentionsPlayer(text, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = "[^\\p{L}\\p{N}_]";
  return new RegExp(`(^|${boundary})${escaped}(${boundary}|$)`, "u").test(text);
}

function orderEvents(events) {
  events.sort((a, b) => a.time - b.time);

  const shots = events.filter((event) => event.kind === "shot");

  for (const event of events) {
    if (event.kind !== "death") continue;

    for (const shot of shots) {
      if (!mentionsPlayer(shot.text, event.name)) continue;
      if (shot.time < event.time) continue;

      // Keep the death after the shot, even when both were recorded at the same
      // millisecond or the death's obituary was timestamped first.
      event.time = shot.time + 0.5;
    }
  }

  events.sort((a, b) => a.time - b.time);
}

export function summariseState(states, stateNum) {
  const state = (states && states[stateNum]) || null;
  const next = nextState(states || {}, stateNum);
  const events = [];

  // Instant actions resolved during this state.
  for (const group of obituaryGroups(state)) {
    if (!INSTANT_SOURCE.test(group.source)) continue;

    for (const death of group.deaths) {
      events.push({ time: group.time, kind: "death", ...death });
    }
  }

  // Deaths that resolved at the end of this state are announced in the next
  // state; instant deaths there belong to the next state.
  if (next) {
    for (const group of obituaryGroups(next)) {
      if (INSTANT_SOURCE.test(group.source)) continue;

      for (const death of group.deaths) {
        events.push({ time: group.time, kind: "death", ...death });
      }
    }
  }

  for (const alert of (state && state.alerts) || []) {
    const content =
      typeof alert === "string" ? alert : alert && alert.content;
    if (typeof content !== "string" || !GUN_ALERT.test(content)) continue;

    events.push({
      time: Number(alert && alert.time) || 0,
      kind: "shot",
      text: stripEmotes(content),
    });
  }

  orderEvents(events);

  const winnerGroups =
    state && state.winners && Array.isArray(state.winners.groups)
      ? state.winners.groups
      : [];

  return {
    name: (state && state.name) || "Unknown state",
    events,
    result:
      winnerGroups.length > 0 ? `${winnerGroups.join(" and ")} win` : null,
    isEmpty: events.length === 0 && winnerGroups.length === 0,
  };
}

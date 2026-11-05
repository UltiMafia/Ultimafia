// The rule classifier reads usernames as ordinary text. In the 5,000-game
// corpus a player named "worstplayer" made neutral lines score as abuse:
// "@worstplayer" 0.98, "loss on you worstplayer" 0.97; with the name replaced
// by "PLAYER" the same lines scored 0.07 and 0.06. Mask names before scoring;
// never change the message that is actually sent.
const MIN_NAME_LENGTH = 3;
const TOKEN = "PLAYER";

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns `(text) => text` with whole-token, case-insensitive name matches
// replaced. Names shorter than three characters are left alone: they collide
// with ordinary words ("a", "Z") and would rewrite most messages.
export function buildNameMasker(names) {
  const unique = Array.from(
    new Set(
      (names || [])
        .filter((name) => typeof name === "string")
        .map((name) => name.trim())
        .filter((name) => name.length >= MIN_NAME_LENGTH)
    )
  ).sort((a, b) => b.length - a.length);

  if (!unique.length) return (text) => String(text || "");

  // Longest first, so "worstplayer2" is not partly matched as "worstplayer".
  // A leading group instead of a lookbehind keeps this working on older Safari.
  const alternation = unique.map(escapeRegExp).join("|");
  const pattern = new RegExp(
    `(^|[^A-Za-z0-9_])(${alternation})(?![A-Za-z0-9_])`,
    "gi"
  );

  return (text) => String(text || "").replace(pattern, `$1${TOKEN}`);
}

export function collectPlayerNames(players, spectators) {
  const names = [];
  for (const collection of [players, spectators]) {
    for (const player of Object.values(collection || {})) {
      if (player && typeof player.name === "string") names.push(player.name);
    }
  }
  return names;
}

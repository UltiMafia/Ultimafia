// Tab completion of names in the game chat box. Plain CommonJS with no React
// so the server tests (mocha) and the client node tests
// (react_main/test/tabComplete.test.mjs) can load it directly.
//
// The client's player map can hold the same name more than once: a player
// who leaves a pregame seat and sits back down (Spectate then Join open seat,
// a failed ready check then taking a seat, or leaving and rejoining) gets a
// new player id, and the old entry stays marked `left`. Identical names used
// to keep the common-prefix loop below running forever and froze the page.

// Names Tab completes. Players still in the game always. Current spectators
// too during pregame (everyone shares Pregame chat), and for spectators
// during the game (spectator chat). Players in a started game never get
// spectator names. No empty names and no repeats.
function tabCompleteNames({ players, spectators, isPregame, isSpectator }) {
  const names = [];
  const seen = new Set();
  const add = (person) => {
    if (!person || person.left) return;
    const name = person.name;
    if (typeof name !== "string" || !name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  };

  for (const player of Object.values(players || {})) add(player);

  if (isPregame || isSpectator) {
    for (const spectator of Object.values(spectators || {})) {
      if (spectator && spectator.watching) add(spectator);
    }
  }

  return names;
}

// Completes the last word of the chat box against `names`.
// Returns undefined when the word has no name characters to complete (the
// caller does nothing), null when no name matches (the caller may try
// @everyone), else the completed word: the full name for one match, or the
// longest common prefix of several.
function completePlayerName(word, names) {
  word = String(word || "");
  // Removing non-word characters before the string.
  const seedString = word.match(/[^\w-]?([\w-]*)$/)[1].toLowerCase();
  const prefix = word.substring(0, word.length - seedString.length);
  if (!seedString.length) return undefined;

  const matched = [
    ...new Set(
      (names || []).filter(
        (name) =>
          typeof name === "string" &&
          name.length > 0 &&
          name.toLowerCase().substring(0, seedString.length) === seedString
      )
    ),
  ];
  if (!matched.length) return null;
  if (matched.length === 1) return prefix + matched[0];

  // Bounded by the shortest match, so it ends even if two names are equal.
  const maxLength = Math.min(...matched.map((name) => name.length));
  let i = 1;
  while (i < maxLength && matched.every((name) => name[i] === matched[0][i]))
    i += 1;
  return prefix + matched[0].substring(0, i);
}

module.exports = { tabCompleteNames, completePlayerName };

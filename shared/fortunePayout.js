/**
 * The two-faction payout band, defined once for every caller.
 *
 * A ranked or competitive Mafia setup with exactly two factions pays between
 * 50 and 70 fortune per win. The award, the setup Statistics tab and the
 * Fortune calculator all have to apply that same rule: when each of them
 * carried its own copy, the Statistics tab could advertise a payout the game
 * would never award (#3172).
 *
 * react_main/src/shared/fortunePayout.js mirrors this file for the client
 * bundle, which cannot import from this directory; test/sharedFortunePayout
 * fails if the two drift.
 */
const TWO_FACTION_MIN = 50;
const TWO_FACTION_MAX = 70;

function clampTwoFactionPayout(value) {
  return Math.max(TWO_FACTION_MIN, Math.min(TWO_FACTION_MAX, value));
}

module.exports = { TWO_FACTION_MIN, TWO_FACTION_MAX, clampTwoFactionPayout };

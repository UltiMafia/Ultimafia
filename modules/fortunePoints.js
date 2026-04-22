/**
 * Fortune / misfortune points for ranked & competitive games.
 * Uses empirical setup win rates derived only from ranked and competitive
 * games — unranked games do not influence fortune payouts.
 */
const constants = require("../data/constants");

const FORTUNE_GAME_TYPES = new Set(["ranked", "competitive"]);

// entries: Array<[gameType, isFactionWin]>
function winRateFromAlignmentEntries(entries) {
  if (!entries || !entries.length) return null;
  let wins = 0;
  let games = 0;
  for (const [gameType, isFactionWin] of entries) {
    if (!FORTUNE_GAME_TYPES.has(gameType)) continue;
    games++;
    if (isFactionWin === true) wins++;
  }
  if (games === 0) return null;
  return wins / games;
}

/**
 * True for independents / odd factions; false for Village, Cult, and *Mafia teams (incl. Red Mafia).
 */
function shouldCapFortuneAt120(factionKey) {
  if (factionKey === "Traitor") return false;
  if (["Village", "Mafia", "Cult"].includes(factionKey)) return false;
  if (typeof factionKey === "string" && factionKey.endsWith("Mafia")) return false;
  return true;
}

// Floor on a faction's raw winrate before normalization. Prevents a 0%
// historical winrate from collapsing the payout weight to zero — otherwise a
// faction that finally defies a lopsided setup would receive 0 fortune for
// winning, which is the opposite of the intended reward.
const MIN_RAW_WIN_RATE = 0.05;

/**
 * Build non-negative weights per faction that sum to 1, for factions present in this game.
 */
function buildPayoutWeights(factionNames, alignmentWinRates) {
  const map = alignmentWinRates || {};
  const n = factionNames.length;
  if (n === 0) return {};

  const raw = {};
  let anyData = false;
  for (const f of factionNames) {
    const w = winRateFromAlignmentEntries(map[f]);
    raw[f] = w;
    if (w != null && !Number.isNaN(w)) anyData = true;
  }

  if (!anyData) {
    const eq = 1 / n;
    const out = {};
    factionNames.forEach((f) => {
      out[f] = eq;
    });
    return out;
  }

  for (const f of factionNames) {
    if (raw[f] != null && !Number.isNaN(raw[f]) && raw[f] < MIN_RAW_WIN_RATE) {
      raw[f] = MIN_RAW_WIN_RATE;
    }
  }

  let sum = 0;
  for (const f of factionNames) {
    const w = raw[f];
    if (w == null || Number.isNaN(w)) {
      raw[f] = null;
    } else {
      sum += w;
    }
  }

  const missing = factionNames.filter((f) => raw[f] == null);
  if (missing.length) {
    const fill = sum > 0 ? sum / (n - missing.length) : 1 / n;
    missing.forEach((f) => {
      raw[f] = fill;
    });
  }

  sum = factionNames.reduce((acc, f) => acc + raw[f], 0);
  if (sum <= 0) {
    const eq = 1 / n;
    const out = {};
    factionNames.forEach((f) => {
      out[f] = eq;
    });
    return out;
  }

  const out = {};
  factionNames.forEach((f) => {
    out[f] = raw[f] / sum;
  });
  return out;
}

/**
 * @param {object} opts
 * @param {string[]} opts.factionNames
 * @param {object} opts.alignmentWinRates - SetupVersion.setupStats.alignmentWinRates
 * @param {number} [opts.K]
 * @returns {{ pointsWonByFactions: object, pointsLostByFactions: object }}
 */
function computeFactionFortunePoints(opts) {
  const K = opts.K != null ? opts.K : constants.fortunePointsNominalK;
  const factionNames = opts.factionNames || [];
  const weights = buildPayoutWeights(factionNames, opts.alignmentWinRates || {});

  const pointsWonByFactions = {};
  const pointsLostByFactions = {};

  if (factionNames.length === 0) {
    return { pointsWonByFactions, pointsLostByFactions };
  }

  // Same formula for all faction counts: win payout uses this faction's weight
  // (previously n===2 inverted opponent weights, which could zero one side).
  for (const f of factionNames) {
    let winPts = Math.round(K * weights[f]);
    if (shouldCapFortuneAt120(f)) winPts = Math.min(120, winPts);
    pointsWonByFactions[f] = winPts;

    pointsLostByFactions[f] = Math.round(K * (1 - weights[f]));
  }

  return { pointsWonByFactions, pointsLostByFactions };
}

/**
 * Build alignmentWinRates-shaped map from SetupVersion.setupStats.alignmentRows.
 * @param {object} setupStats
 * @returns {object} map factionKey -> Array<[gameType, boolean]>
 */
function alignmentRowsToWinRateMap(setupStats) {
  const map = {};
  if (!setupStats) return map;
  // Legacy `alignmentWinRates` stored bare booleans with no gameType tag,
  // so entries cannot be attributed to ranked/competitive and are skipped.
  const rows = setupStats.alignmentRows;
  // rows: Array<[factionKey, gameType, isFactionWin]>
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const [factionKey, gameType, isFactionWin] = row;
      if (!map[factionKey]) map[factionKey] = [];
      map[factionKey].push([gameType, isFactionWin]);
    }
  }
  return map;
}

module.exports = {
  winRateFromAlignmentEntries,
  shouldCapFortuneAt120,
  buildPayoutWeights,
  computeFactionFortunePoints,
  alignmentRowsToWinRateMap,
};

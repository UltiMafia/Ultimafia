/**
 * Fortune / misfortune points for ranked & competitive games.
 * Uses empirical setup win rates (all modes combined), not openskill.
 */
const constants = require("../data/constants");

function winRateFromAlignmentEntries(entries) {
  if (!entries || !entries.length) return null;
  let wins = 0;
  for (const row of entries) {
    if (Array.isArray(row) && row[1] === true) wins++;
  }
  return wins / entries.length;
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

  if (factionNames.length === 2) {
    const [a, b] = factionNames;
    let winA = Math.round(K * weights[b]);
    let winB = Math.round(K * weights[a]);
    if (shouldCapFortuneAt120(a)) winA = Math.min(120, winA);
    if (shouldCapFortuneAt120(b)) winB = Math.min(120, winB);
    pointsWonByFactions[a] = winA;
    pointsWonByFactions[b] = winB;
    pointsLostByFactions[a] = Math.round(K * weights[a]);
    pointsLostByFactions[b] = Math.round(K * weights[b]);
    return { pointsWonByFactions, pointsLostByFactions };
  }

  for (const f of factionNames) {
    let winPts = Math.round(K * weights[f]);
    if (shouldCapFortuneAt120(f)) winPts = Math.min(120, winPts);
    pointsWonByFactions[f] = winPts;

    pointsLostByFactions[f] = Math.round(K * (1 - weights[f]));
  }

  return { pointsWonByFactions, pointsLostByFactions };
}

/**
 * Build alignmentWinRates-shaped map from SetupVersion.setupStats (legacy object and/or alignmentRows).
 * @param {object} setupStats
 * @returns {object} map factionKey -> Array<[gameType, boolean]>
 */
function alignmentRowsToWinRateMap(setupStats) {
  const map = {};
  if (!setupStats) return map;
  const legacy = setupStats.alignmentWinRates;
  if (legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
    for (const k of Object.keys(legacy)) {
      const v = legacy[k];
      if (Array.isArray(v)) {
        map[k] = v.slice();
      }
    }
  }
  const rows = setupStats.alignmentRows;
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const [k, gameType, won] = row;
      if (!map[k]) map[k] = [];
      map[k].push([gameType, won]);
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

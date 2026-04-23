/**
 * Fortune points for ranked & competitive games.
 *
 * Payout model:
 *   Major factions (Village / Mafia / Cult / any *Mafia variant):
 *     solo win:   K * (1 - wr)
 *     joint win:  solo * 0.9
 *   Independents (everything else):
 *     solo win:   min(120, sqrt(ANCHOR_WR / wr) * ANCHOR_PAYOUT)
 *     joint win:  solo * 0.7
 *
 * Lower historical winrate pays more on a win; joint wins are dampened
 * because they are easier to achieve than a clean solo victory.
 *
 * Historical winrate is derived from ranked + competitive rows only;
 * unranked games do not influence fortune payouts.
 *
 * Misfortune (the loss penalty half of the old system) has been scrapped —
 * losing factions always earn 0 fortune. The pointsLostByFactions return
 * value is preserved as a compat shim for existing callers.
 */
const constants = require("../data/constants");

const FORTUNE_GAME_TYPES = new Set(["ranked", "competitive"]);

const ANCHOR_WR = 0.1;
const ANCHOR_PAYOUT = 80;
const INDEPENDENT_CAP = 120;
const JOINT_DAMP_MAJOR = 0.9;
const JOINT_DAMP_INDEPENDENT = 0.7;

// Priors when a faction has no ranked/competitive history yet.
// Majors get a neutral 50/50 (→ half of K on a solo win); independents
// get the anchor itself (→ exactly the anchor payout).
const DEFAULT_MAJOR_WR = 0.5;
const DEFAULT_INDEPENDENT_WR = ANCHOR_WR;

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

function isMajorFaction(factionKey) {
  if (["Village", "Mafia", "Cult"].includes(factionKey)) return true;
  if (typeof factionKey === "string" && factionKey.endsWith("Mafia")) return true;
  return false;
}

function winrateFor(factionKey, alignmentWinRates) {
  const wr = winRateFromAlignmentEntries((alignmentWinRates || {})[factionKey]);
  if (wr == null || Number.isNaN(wr)) {
    return isMajorFaction(factionKey) ? DEFAULT_MAJOR_WR : DEFAULT_INDEPENDENT_WR;
  }
  return wr;
}

function soloPayout(factionKey, wr, K) {
  if (isMajorFaction(factionKey)) {
    return (1 - wr) * K;
  }
  const raw = wr > 0 ? Math.sqrt(ANCHOR_WR / wr) * ANCHOR_PAYOUT : Infinity;
  return Math.min(INDEPENDENT_CAP, raw);
}

function jointDampFor(factionKey) {
  return isMajorFaction(factionKey) ? JOINT_DAMP_MAJOR : JOINT_DAMP_INDEPENDENT;
}

/**
 * @param {object} opts
 * @param {string[]} opts.factionNames    All factions present in the game.
 * @param {string[]} opts.winningFactions Subset of factionNames that won (solo = 1, joint = 2+).
 * @param {object}   opts.alignmentWinRates  factionKey → Array<[gameType, won]>
 * @param {number}   [opts.K]  Base payout (default constants.fortunePointsNominalK).
 * @returns {{ pointsWonByFactions: object, pointsLostByFactions: object }}
 */
function computeFactionFortunePoints(opts) {
  const K = opts.K != null ? opts.K : constants.fortunePointsNominalK;
  const factionNames = opts.factionNames || [];
  const winningFactions = opts.winningFactions || [];
  const winSet = new Set(winningFactions);
  const isJoint = winSet.size >= 2;

  const pointsWonByFactions = {};
  const pointsLostByFactions = {};

  for (const f of factionNames) {
    // Misfortune has been scrapped — losers always earn 0 fortune.
    pointsLostByFactions[f] = 0;

    if (!winSet.has(f)) {
      pointsWonByFactions[f] = 0;
      continue;
    }

    const wr = winrateFor(f, opts.alignmentWinRates);
    let payout = soloPayout(f, wr, K);
    if (isJoint) payout *= jointDampFor(f);
    pointsWonByFactions[f] = Math.round(payout);
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
  const rows = setupStats.alignmentRows;
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
  isMajorFaction,
  computeFactionFortunePoints,
  alignmentRowsToWinRateMap,
};

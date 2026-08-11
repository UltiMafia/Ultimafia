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
const roleData = require("../data/roles");

const FORTUNE_GAME_TYPES = new Set(["ranked", "competitive"]);
const MAJOR_ALIGNMENTS = new Set(["Village", "Mafia", "Cult"]);

const ANCHOR_WR = 0.1;
const ANCHOR_PAYOUT = 80;
const INDEPENDENT_CAP = 120;
const JOINT_DAMP_MAJOR = 0.9;
const JOINT_DAMP_INDEPENDENT = 0.7;

// Setups with fewer than this many ranked/competitive plays always pay a flat
// LOW_SAMPLE_PAYOUT regardless of computed winrate — small samples are noisy.
const MIN_FORTUNE_GAMES = 25;
const LOW_SAMPLE_PAYOUT = 60;

// Clamping rules for setups with 2 factions and skewed win ratios above the minimum fortune games
const TWO_FACTION_MIN = 50;
const TWO_FACTION_MAX = 70;

// Priors when a faction has no ranked/competitive history yet.
// Majors get a neutral 50/50 (→ half of K on a solo win); independents
// get the anchor itself (→ exactly the anchor payout).
const DEFAULT_MAJOR_WR = 0.5;
const DEFAULT_INDEPENDENT_WR = ANCHOR_WR;

function winRateFromAlignmentEntries(entries) {
  if (!entries || !entries.length) return null;
  let wins = 0;
  let games = 0;
  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    // Aggregated summary: ["__agg__", gameType, wins, games]
    if (entry[0] === "__agg__") {
      const gameType = entry[1];
      if (!FORTUNE_GAME_TYPES.has(gameType)) continue;
      wins += Number(entry[2]) || 0;
      games += Number(entry[3]) || 0;
      continue;
    }
    const [gameType, isFactionWin] = entry;
    if (!FORTUNE_GAME_TYPES.has(gameType)) continue;
    games++;
    if (isFactionWin === true) wins++;
  }
  if (games === 0) return null;
  return wins / games;
}

function countFortuneGames(entries) {
  if (!entries || !entries.length) return 0;
  let games = 0;
  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length < 1) continue;
    if (entry[0] === "__agg__") {
      const gameType = entry[1];
      if (!FORTUNE_GAME_TYPES.has(gameType)) continue;
      games += Number(entry[3]) || 0;
      continue;
    }
    const [gameType] = entry;
    if (FORTUNE_GAME_TYPES.has(gameType)) games++;
  }
  return games;
}

function isMajorFaction(factionKey) {
  if (["Village", "Mafia", "Cult"].includes(factionKey)) return true;
  if (typeof factionKey === "string" && factionKey.endsWith("Mafia")) return true;
  return false;
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
  const isTwoFactionGame = factionNames.length === 2;

  const soloRows = computeSoloPayoutsForSetup({
    factions: factionNames,
    alignmentWinRates: opts.alignmentWinRates,
    K,
  });
  const rowByFaction = {};
  for (const r of soloRows) rowByFaction[r.faction] = r;

  const pointsWonByFactions = {};
  const pointsLostByFactions = {};

  for (const f of factionNames) {
    // Misfortune has been scrapped — losers always earn 0 fortune.
    pointsLostByFactions[f] = 0;

    if (!winSet.has(f)) {
      pointsWonByFactions[f] = 0;
      continue;
    }

    const row = rowByFaction[f];
    if (row.lowSampleSize) {
      pointsWonByFactions[f] = row.soloPayout;
    } else {
      pointsWonByFactions[f] = isJoint
        ? Math.round(row.soloPayoutExact * jointDampFor(f))
        : row.soloPayout;
    }
    if(isTwoFactionGame){
      pointsWonByFactions[f] = Math.max(TWO_FACTION_MIN, Math.min(TWO_FACTION_MAX,pointsWonByFactions[f]));
    }
  }

  return { pointsWonByFactions, pointsLostByFactions };
}

/**
 * Derive the faction list a Mafia setup can produce, mirroring the convention
 * used in Game.js when stamping alignmentRows: Village/Mafia/Cult collapse to
 * the alignment, Traitor collapses to "Mafia", everything else (Independents)
 * uses the role name as its own faction key. Dedup + stable order.
 *
 * Used by route handlers so empty-history setups still yield a row per
 * faction (showing the prior-based default payout).
 *
 * @param {Array<object>|string} setupRoles  setup.roles — either the parsed
 *   array of role-group maps or the JSON string straight off the DB.
 * @returns {string[]}  Faction keys, alphabetically sorted.
 */
function getMafiaFactionsFromSetup(setupRoles) {
  if (!setupRoles) return [];
  let groups = setupRoles;
  if (typeof groups === "string") {
    try {
      groups = JSON.parse(groups);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(groups)) return [];

  const factions = new Set();
  const mafiaRoles = roleData.Mafia || {};
  for (const group of groups) {
    if (!group) continue;
    for (const rawKey of Object.keys(group)) {
      const roleName = rawKey.split(":")[0];
      const entry = mafiaRoles[roleName];
      if (!entry || !entry.alignment) continue;
      if (entry.alignment === "Event") continue;
      // Match Game.js: Traitor (alignment Independent) plays as Mafia faction.
      if (roleName === "Traitor") {
        factions.add("Mafia");
        continue;
      }
      if (MAJOR_ALIGNMENTS.has(entry.alignment)) {
        factions.add(entry.alignment);
      } else {
        factions.add(roleName);
      }
    }
  }
  return Array.from(factions).sort();
}

/**
 * Build alignmentWinRates-shaped map from SetupVersion.setupStats.
 * Prefers fixed-size alignmentAgg (faction -> gameType -> {wins, games}).
 * Falls back to legacy unbounded alignmentRows for unmigrated documents.
 *
 * When using aggregates, expands to a compact synthetic entry list is avoided
 * for large N — instead we store a single summary triple per gameType:
 *   [gameType, wins, games] with a marker shape detected by winRate helpers.
 * For backcompat with code that expects [gameType, wonBool] pairs, we expand
 * only when games is small; for large counts we use a special summary form
 * handled by winRateFromAlignmentEntries / countFortuneGames.
 *
 * @param {object} setupStats
 * @returns {object} map factionKey -> entries
 */
function alignmentRowsToWinRateMap(setupStats) {
  const map = {};
  if (!setupStats) return map;

  // Legacy per-game rows (unbounded; still present until compactSetupStatsRows migration)
  const rows = setupStats.alignmentRows;
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const [factionKey, gameType, isFactionWin] = row;
      if (!map[factionKey]) map[factionKey] = [];
      map[factionKey].push([gameType, isFactionWin]);
    }
  }

  // Fixed-size aggregates (preferred going forward). During transition both may
  // exist: rows hold pre-fix history, agg holds post-fix games — sum both.
  const agg = setupStats.alignmentAgg;
  if (agg && typeof agg === "object") {
    for (const [factionKey, byType] of Object.entries(agg)) {
      if (!byType || typeof byType !== "object") continue;
      if (!map[factionKey]) map[factionKey] = [];
      for (const [gameType, stats] of Object.entries(byType)) {
        if (!stats || typeof stats !== "object") continue;
        const games = Number(stats.games) || 0;
        const wins = Number(stats.wins) || 0;
        if (games <= 0 && wins <= 0) continue;
        // Summary form: ["__agg__", gameType, wins, games]
        map[factionKey].push(["__agg__", gameType, wins, games]);
      }
    }
  }
  return map;
}

/**
 * Per-faction solo-win fortune payouts, derived from historical
 * ranked/competitive winrate. Factions with no eligible games fall back to
 * the same priors as a real payout computation (50% major / 10% independent).
 *
 * Faction list comes from `opts.factions` if given, otherwise from the keys of
 * `opts.alignmentWinRates`, otherwise from the keys derived from
 * `opts.setupStats.alignmentRows`.
 *
 * Each row exposes both `soloPayout` (rounded int, for display) and
 * `soloPayoutExact` (float, for callers like `computeFactionFortunePoints`
 * that need to apply joint dampening before a final round).
 *
 * @param {object} opts
 * @param {object} [opts.setupStats]        SetupVersion.setupStats; used when alignmentWinRates not provided.
 * @param {object} [opts.alignmentWinRates] factionKey → Array<[gameType, won]>; takes precedence over setupStats.
 * @param {string[]} [opts.factions]        Explicit faction list; defaults to alignmentWinRates keys.
 * @param {number} [opts.K]                 Base payout (default constants.fortunePointsNominalK).
 * @returns {Array<{ faction: string, isMajor: boolean, winrate: number,
 *                   hasHistoricalWinrate: boolean, soloPayout: number,
 *                   soloPayoutExact: number }>}
 *          Sorted majors-first then alphabetically.
 */
function computeSoloPayoutsForSetup(opts) {
  const o = opts || {};
  const K = o.K != null ? o.K : constants.fortunePointsNominalK;
  const alignmentWinRates =
    o.alignmentWinRates || alignmentRowsToWinRateMap(o.setupStats);
  const factions = o.factions || Object.keys(alignmentWinRates);

  const result = factions.map((faction) => {
    const observed = winRateFromAlignmentEntries(alignmentWinRates[faction]);
    const games = countFortuneGames(alignmentWinRates[faction]);
    const hasHistoricalWinrate = observed != null && !Number.isNaN(observed);
    const winrate = hasHistoricalWinrate
      ? observed
      : isMajorFaction(faction)
      ? DEFAULT_MAJOR_WR
      : DEFAULT_INDEPENDENT_WR;
    const lowSampleSize = games < MIN_FORTUNE_GAMES;
    const exact = lowSampleSize
      ? LOW_SAMPLE_PAYOUT
      : soloPayout(faction, winrate, K);
    return {
      faction,
      isMajor: isMajorFaction(faction),
      winrate,
      hasHistoricalWinrate,
      games,
      lowSampleSize,
      soloPayout: Math.round(exact),
      soloPayoutExact: exact,
    };
  });

  // Two-faction setups clamp display/solo payouts into [50, 70] once samples
  // are large enough (same rule as computeFactionFortunePoints for winners).
  if (factions.length === 2) {
    for (const row of result) {
      if (row.lowSampleSize) continue;
      row.soloPayoutExact = Math.max(
        TWO_FACTION_MIN,
        Math.min(TWO_FACTION_MAX, row.soloPayoutExact)
      );
      row.soloPayout = Math.round(row.soloPayoutExact);
    }
  }

  result.sort((a, b) => {
    if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
    return a.faction.localeCompare(b.faction);
  });
  return result;
}

module.exports = {
  winRateFromAlignmentEntries,
  countFortuneGames,
  isMajorFaction,
  computeFactionFortunePoints,
  computeSoloPayoutsForSetup,
  alignmentRowsToWinRateMap,
  getMafiaFactionsFromSetup,
  MIN_FORTUNE_GAMES,
  LOW_SAMPLE_PAYOUT,
};

// Post-game kudos voting: one secret, locked-once-cast vote per alignment row.
//
// The award rule is kept as pure functions (rowWinners / guaranteedRowWinners)
// so it can be unit tested without a game; KudosVote holds the per-game state.

const NO_ONE = "*";

// Row order shown to players. Every alignment that isn't Village, Mafia or
// Cult (Independent, Hostile, game-type specific teams, ...) shares the
// Independent row.
const KUDOS_ROWS = [
  { key: "Village", label: "Town" },
  { key: "Mafia", label: "Mafia" },
  { key: "Cult", label: "Cult" },
  { key: "Independent", label: "Independent" },
];

function rowKeyForAlignment(alignment) {
  if (alignment === "Village" || alignment === "Town") return "Village";
  if (alignment === "Mafia") return "Mafia";
  if (alignment === "Cult") return "Cult";
  return "Independent";
}

// Kudos are only handed out after a real win/loss: someone has to have won,
// and the game can't have ended in a "No one wins" (stalemate, meteor,
// everyone left, ...).
function isWinLossResult({ winnerGroups = [], winnerPlayerIds = [], meteor }) {
  if (meteor) return false;
  if (!winnerPlayerIds || winnerPlayerIds.length === 0) return false;
  const groups = (winnerGroups || []).filter((g) => g !== "No one");
  return groups.length > 0;
}

function countRowVotes(candidates, ballots) {
  const counts = {};
  for (const id of candidates) counts[id] = 0;
  let noOne = 0;
  for (const target of ballots) {
    if (target === NO_ONE) noOne++;
    else if (target in counts) counts[target]++;
  }
  return { counts, noOne };
}

// Final rule for one row, using only cast votes. A player wins if they have
// the most player votes, at least 2 votes, and at least as many votes as
// "No one". Tied top players each win.
function rowWinners({ counts, noOne }) {
  const ids = Object.keys(counts);
  if (ids.length === 0) return [];
  const max = Math.max(...ids.map((id) => counts[id]));
  if (max < 2 || max < noOne) return [];
  return ids.filter((id) => counts[id] === max);
}

// Players who win this row no matter how the `remaining` uncast votes go
// (each may go to any other player, to "No one", or never be cast). The worst
// case for a player is all remaining votes landing on their strongest rival
// or on "No one". A tie with "No one" still wins, but a tie between players
// is never settled early: while any vote is outstanding a player must be
// strictly ahead of every rival's best case. With nothing outstanding this is
// the final rule, so certain ties are awarded to each tied player.
function guaranteedRowWinners({ counts, noOne }, remaining) {
  const ids = Object.keys(counts);
  return ids.filter((id) => {
    const mine = counts[id];
    if (mine < 2 || mine < noOne + remaining) return false;
    let rival = 0;
    for (const other of ids)
      if (other !== id && counts[other] > rival) rival = counts[other];
    return remaining > 0 ? mine > rival + remaining : mine >= rival;
  });
}

// Bot test mode: what a bot votes in one row. Most bots back the row's
// "favorite" (picked once per row so awards actually happen), some pick
// someone else, some pick No one. Never themselves.
function pickBotVote(candidates, botId, favorite, rand = Math.random) {
  const others = candidates.filter((id) => id !== botId);
  if (others.length === 0) return NO_ONE;
  const r = rand();
  if (favorite && favorite !== botId && others.includes(favorite) && r < 0.65)
    return favorite;
  if (r < 0.85) return others[Math.floor(rand() * others.length)];
  return NO_ONE;
}

class KudosVote {
  // candidates: [{ id, alignment }]; voters: [playerId]. testMode marks a
  // game with bots in it: everything works, but nothing gets saved.
  constructor({ candidates, voters, testMode = false }) {
    this.testMode = !!testMode;
    this.rows = [];
    const byRow = {};
    for (const c of candidates) {
      const key = rowKeyForAlignment(c.alignment);
      (byRow[key] = byRow[key] || []).push(c.id);
    }
    for (const row of KUDOS_ROWS) {
      if (byRow[row.key] && byRow[row.key].length > 0)
        this.rows.push({ ...row, candidates: byRow[row.key] });
    }
    this.voters = new Set(voters);
    this.ballots = {}; // voterId -> { rowKey: target }
    this.autoNoOne = {}; // voterId -> [rowKey] No one votes cast on leaving
    this.awarded = {}; // rowKey -> [playerId]
    this.finalized = false;
  }

  getRow(rowKey) {
    return this.rows.find((r) => r.key === rowKey);
  }

  canVote(voterId) {
    return !this.finalized && this.voters.has(voterId);
  }

  // Returns null on success, or a reason string.
  castVote(voterId, rowKey, target) {
    if (this.finalized) return "Kudos voting is over.";
    if (!this.voters.has(voterId)) return "You can't vote for kudos.";
    const row = this.getRow(rowKey);
    if (!row) return "Unknown kudos row.";
    if (target !== NO_ONE && !row.candidates.includes(target))
      return "Invalid kudos target.";
    if (target === voterId) return "You Cannot Kudo Yourself!";
    const mine = (this.ballots[voterId] = this.ballots[voterId] || {});
    if (rowKey in mine) return "Your kudos vote for this row is locked.";
    mine[rowKey] = target;
    return null;
  }

  // A voter who leaves before voting ends gets a "No one" vote in every row
  // they haven't voted in; votes they already cast stay. Those No one votes
  // count like any other, but never earn a coin.
  removeVoter(voterId) {
    if (!this.voters.has(voterId)) return;
    if (!this.finalized) {
      const mine = (this.ballots[voterId] = this.ballots[voterId] || {});
      const auto = [];
      for (const row of this.rows) {
        if (row.key in mine) continue;
        mine[row.key] = NO_ONE;
        auto.push(row.key);
      }
      if (auto.length > 0) this.autoNoOne[voterId] = auto;
    }
    this.voters.delete(voterId);
  }

  // Coins for voting, once voting is settled: +1 per row a voter voted in
  // (a player or No one) if that row awarded kudos to anyone. Votes cast for
  // a leaver are skipped. voterId -> coins (only voters with coins).
  voterCoins() {
    const coins = {};
    if (!this.finalized) return coins;
    for (const voterId in this.ballots) {
      const auto = this.autoNoOne[voterId] || [];
      let n = 0;
      for (const rowKey in this.ballots[voterId]) {
        if (auto.includes(rowKey)) continue;
        if ((this.awarded[rowKey] || []).length > 0) n++;
      }
      if (n > 0) coins[voterId] = n;
    }
    return coins;
  }

  tally(rowKey) {
    const row = this.getRow(rowKey);
    const ballots = [];
    for (const voterId in this.ballots)
      if (rowKey in this.ballots[voterId])
        ballots.push(this.ballots[voterId][rowKey]);
    return countRowVotes(row.candidates, ballots);
  }

  remaining(rowKey) {
    let n = 0;
    for (const voterId of this.voters) {
      const mine = this.ballots[voterId];
      if (!mine || !(rowKey in mine)) n++;
    }
    return n;
  }

  // Re-checks every row and returns the newly awarded player ids. With
  // `final`, uncast votes are dropped and every row is settled.
  evaluate(final = false) {
    const fresh = [];
    for (const row of this.rows) {
      const tally = this.tally(row.key);
      const winners = final
        ? rowWinners(tally)
        : guaranteedRowWinners(tally, this.remaining(row.key));
      const have = (this.awarded[row.key] = this.awarded[row.key] || []);
      for (const id of winners) {
        if (!have.includes(id)) {
          have.push(id);
          fresh.push(id);
        }
      }
    }
    if (final) this.finalized = true;
    return fresh;
  }

  awardedIds() {
    const all = [];
    for (const row of this.rows)
      for (const id of this.awarded[row.key] || [])
        if (!all.includes(id)) all.push(id);
    return all;
  }

  // What one client may see: the rows, their own votes, and the awards.
  // Nobody else's votes or any counts are included.
  stateFor(viewerId) {
    return {
      rows: this.rows.map((r) => ({
        key: r.key,
        label: r.label,
        candidates: r.candidates.slice(),
      })),
      myVotes: { ...(this.ballots[viewerId] || {}) },
      awarded: Object.fromEntries(
        this.rows.map((r) => [r.key, (this.awarded[r.key] || []).slice()])
      ),
      canVote: this.canVote(viewerId),
      finalized: this.finalized,
      testMode: this.testMode,
    };
  }
}

module.exports = {
  NO_ONE,
  KUDOS_ROWS,
  rowKeyForAlignment,
  isWinLossResult,
  countRowVotes,
  rowWinners,
  guaranteedRowWinners,
  KudosVote,
  pickBotVote,
};

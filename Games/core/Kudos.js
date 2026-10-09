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

class KudosVote {
  // candidates: [{ id, alignment }]; voters: [playerId]
  constructor({ candidates, voters }) {
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

  // A voter who leaves just stops being able to vote. Their cast votes stay;
  // rows they never voted in don't count them (non-voters aren't quorum).
  removeVoter(voterId) {
    this.voters.delete(voterId);
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
};

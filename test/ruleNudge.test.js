const chai = require("chai");
const expect = chai.expect;
const policy = require("../modules/ruleNudgePolicy");

// In-memory stand-in for the Redis store: tokens are single-use, counters are
// per player-game, and the nudge is claimed once.
function makeStore() {
  const tokens = new Map();
  const counts = new Map();
  const nudged = new Set();

  return {
    tokens,
    async takeToken(token) {
      const verdict = tokens.get(token);
      tokens.delete(token);
      return verdict || null;
    },
    async countFlag(gameId, userId) {
      const key = `${gameId}:${userId}`;
      const next = (counts.get(key) || 0) + 1;
      counts.set(key, next);
      return next;
    },
    async claimNudge(gameId, userId) {
      const key = `${gameId}:${userId}`;
      if (nudged.has(key)) return false;
      nudged.add(key);
      return true;
    },
  };
}

function verdict(overrides = {}) {
  return { u: "user-1", g: "game-1", c: "abuse", p: 0.95, e: false, ...overrides };
}

describe("rule nudge policy", function () {
  it("nudges exactly on the fifth accepted flag", async function () {
    const store = makeStore();
    const outcomes = [];

    for (let i = 0; i < 6; i++) {
      store.tokens.set(`t${i}`, verdict());
      outcomes.push(
        await policy.noteVerdict(
          { gameId: "game-1", userId: "user-1", token: `t${i}` },
          store
        )
      );
    }

    expect(outcomes.map((o) => o.count)).to.deep.equal([1, 2, 3, 4, 5, 6]);
    expect(outcomes.map((o) => o.nudge)).to.deep.equal([
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
    expect(outcomes[5].reason).to.equal("already");
  });

  it("does not count another game's token", async function () {
    const store = makeStore();
    store.tokens.set("t", verdict({ g: "game-2" }));
    const outcome = await policy.noteVerdict(
      { gameId: "game-1", userId: "user-1", token: "t" },
      store
    );
    expect(outcome).to.deep.equal({ counted: false, nudge: false, reason: "mismatch" });
  });

  it("does not count another user's token", async function () {
    const store = makeStore();
    store.tokens.set("t", verdict({ u: "user-2" }));
    const outcome = await policy.noteVerdict(
      { gameId: "game-1", userId: "user-1", token: "t" },
      store
    );
    expect(outcome.reason).to.equal("mismatch");
  });

  it("skips when the pre-send abuse prompt was on", async function () {
    const store = makeStore();
    store.tokens.set("t", verdict({ e: true }));
    const outcome = await policy.noteVerdict(
      { gameId: "game-1", userId: "user-1", token: "t" },
      store
    );
    expect(outcome).to.deep.equal({ counted: false, nudge: false, reason: "prompt-on" });
  });

  it("skips below the probability bar", async function () {
    const store = makeStore();
    store.tokens.set("t", verdict({ p: 0.55 }));
    const outcome = await policy.noteVerdict(
      { gameId: "game-1", userId: "user-1", token: "t" },
      store
    );
    expect(outcome.reason).to.equal("not-abuse");
  });

  it("skips OGI verdicts", async function () {
    const store = makeStore();
    store.tokens.set("t", verdict({ c: "outside_game_influence" }));
    const outcome = await policy.noteVerdict(
      { gameId: "game-1", userId: "user-1", token: "t" },
      store
    );
    expect(outcome.reason).to.equal("not-abuse");
  });

  it("treats a token as single use", async function () {
    const store = makeStore();
    store.tokens.set("t", verdict());
    const input = { gameId: "game-1", userId: "user-1", token: "t" };
    const first = await policy.noteVerdict(input, store);
    const second = await policy.noteVerdict(input, store);
    expect(first.counted).to.equal(true);
    expect(second).to.deep.equal({ counted: false, nudge: false, reason: "no-token" });
  });

  it("keeps the nudge text in step with the threshold", function () {
    expect(policy.NUDGE_TEXT).to.contain(String(policy.FLAG_THRESHOLD));
  });
});

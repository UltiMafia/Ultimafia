const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const ArrayHash = require("../../Games/core/ArrayHash");
const { NO_ONE, KudosVote } = require("../../Games/core/Kudos");

const RELOAD_ALERT = "Reload to read the kudos voting disclosure before voting.";

// ---------------------------------------------------------------------------
// KudosVote on its own
// ---------------------------------------------------------------------------

// t1 t2 t3 are Town, m1 is Mafia; everyone votes.
function makeVote(extra = {}) {
  return new KudosVote({
    candidates: [
      { id: "t1", alignment: "Village" },
      { id: "t2", alignment: "Village" },
      { id: "t3", alignment: "Village" },
      { id: "m1", alignment: "Mafia" },
    ],
    voters: ["t1", "t2", "t3", "m1"],
    ...extra,
  });
}

// A connected viewer: an id plus a socket object that is open.
const viewer = (id, extra = {}) => ({
  id,
  left: false,
  socket: { readyState: 1 },
  ...extra,
});

// t1: Town -> t2, Mafia -> No one.  t3: Town -> t2, then leaves.  m1: Town -> t2.
function castBallots(vote) {
  should.not.exist(vote.castVote("t1", "Village", "t2"));
  should.not.exist(vote.castVote("t1", "Mafia", NO_ONE));
  should.not.exist(vote.castVote("t3", "Village", "t2"));
  should.not.exist(vote.castVote("m1", "Village", "t2"));
  vote.removeVoter("t3");
}

const EXPECTED_BALLOTS = [
  { row: "Village", voterId: "t1", targetId: "t2" },
  { row: "Village", voterId: "t3", targetId: "t2" },
  { row: "Village", voterId: "m1", targetId: "t2" },
  { row: "Mafia", voterId: "t1", targetId: NO_ONE },
];

describe("Kudos final ballot reveal: KudosVote", function () {
  describe("disclosureVersion 0", function () {
    const cases = [
      ["no disclosureVersion given", {}],
      ["disclosureVersion 0", { disclosureVersion: 0 }],
      ["a version other than 1 (2)", { disclosureVersion: 2 }],
      ['the string "1"', { disclosureVersion: "1" }],
      ["true", { disclosureVersion: true }],
      [
        "testMode with version 1 requested",
        { disclosureVersion: 1, testMode: true },
      ],
    ];

    for (const [name, opts] of cases) {
      it(`${name}: stays version 0 and never includes revealedBallots`, function () {
        const vote = makeVote(opts);
        vote.disclosureVersion.should.equal(0);
        const viewers = ["t1", "t2", "t3", "m1"].map((id) => viewer(id));
        const check = () => {
          for (const v of viewers) {
            const state = vote.stateFor(v.id, v.socket);
            state.should.not.have.property("revealedBallots");
            state.should.not.have.property("disclosureVersion");
          }
        };
        check();
        castBallots(vote);
        // Even if something snapshots the audience, a version 0 vote ignores it.
        vote.snapshotDisclosureRecipients(viewers);
        should.equal(vote.disclosureRecipients, null);
        check();
        vote.evaluate(true);
        vote.finalized.should.equal(true);
        check();
      });
    }
  });

  describe("version 1 before finalize", function () {
    it("sends the version but no revealedBallots to anyone", function () {
      const vote = makeVote({ disclosureVersion: 1 });
      vote.disclosureVersion.should.equal(1);
      const viewers = ["t1", "t2", "t3", "m1"].map((id) => viewer(id));
      castBallots(vote);

      // Before the snapshot.
      for (const v of viewers) {
        const state = vote.stateFor(v.id, v.socket);
        state.disclosureVersion.should.equal(1);
        state.should.not.have.property("revealedBallots");
      }
      // After the snapshot, still open (evaluate(false) does not finalize).
      vote.snapshotDisclosureRecipients(viewers);
      vote.evaluate(false);
      vote.finalized.should.equal(false);
      for (const v of viewers)
        vote.stateFor(v.id, v.socket).should.not.have.property("revealedBallots");
    });
  });

  describe("version 1 after snapshot and evaluate(true)", function () {
    it("gives every recipient the same ballots, including No one and a leaver's", function () {
      const vote = makeVote({ disclosureVersion: 1 });
      const viewers = ["t1", "t2", "t3", "m1"].map((id) => viewer(id));
      castBallots(vote);
      vote.snapshotDisclosureRecipients(viewers);
      vote.evaluate(true);
      vote.finalized.should.equal(true);

      const states = viewers.map((v) => vote.stateFor(v.id, v.socket));
      for (const state of states) {
        state.finalized.should.equal(true);
        state.disclosureVersion.should.equal(1);
        state.revealedBallots.should.have.deep.members(EXPECTED_BALLOTS);
        state.revealedBallots.should.have.length(EXPECTED_BALLOTS.length);
      }
      // The same view for all.
      for (const state of states)
        state.revealedBallots.should.deep.equal(states[0].revealedBallots);
      // The No one ballot is there as "*".
      states[0].revealedBallots
        .some((b) => b.voterId === "t1" && b.row === "Mafia" && b.targetId === "*")
        .should.equal(true);
      // t3 was removed by removeVoter after voting: the ballot is still shown,
      // and t3 (still in the snapshot) sees it too.
      vote.voters.has("t3").should.equal(false);
      states[2].revealedBallots
        .some((b) => b.voterId === "t3" && b.targetId === "t2")
        .should.equal(true);
      // Per-viewer fields are still per-viewer.
      states[0].myVotes.should.deep.equal({ Village: "t2", Mafia: NO_ONE });
      states[1].myVotes.should.deep.equal({});
    });

    it("leaves out viewers who were not connected (closed socket or left) at snapshot time", function () {
      const vote = makeVote({ disclosureVersion: 1 });
      const t1 = viewer("t1");
      const t2 = viewer("t2", { socket: { readyState: 3 } });
      const t3 = viewer("t3", { left: true });
      const m1 = viewer("m1", { socket: undefined });
      castBallots(vote);
      vote.snapshotDisclosureRecipients([t1, t2, t3, m1]);
      vote.evaluate(true);
      vote.stateFor("t1", t1.socket).should.have.property("revealedBallots");
      vote.stateFor("t2", t2.socket).should.not.have.property("revealedBallots");
      vote.stateFor("t3", t3.socket).should.not.have.property("revealedBallots");
      vote.stateFor("m1", undefined).should.not.have.property("revealedBallots");
    });

    it("does not snapshot after finalize and keeps the first snapshot", function () {
      const vote = makeVote({ disclosureVersion: 1 });
      const first = viewer("t1");
      const late = viewer("t2");
      castBallots(vote);
      vote.snapshotDisclosureRecipients([first]);
      vote.snapshotDisclosureRecipients([first, late]); // ignored: already taken
      vote.evaluate(true);
      vote.stateFor("t1", first.socket).should.have.property("revealedBallots");
      vote.stateFor("t2", late.socket).should.not.have.property("revealedBallots");

      const finalizedFirst = makeVote({ disclosureVersion: 1 });
      castBallots(finalizedFirst);
      finalizedFirst.evaluate(true);
      finalizedFirst.snapshotDisclosureRecipients([viewer("t1")]);
      should.equal(finalizedFirst.disclosureRecipients, null);
    });
  });

  describe("version 1 after finalize, viewer outside the snapshot", function () {
    it("gives nothing to a viewer not in the snapshot, or to the same id on another socket", function () {
      const vote = makeVote({ disclosureVersion: 1 });
      const t1 = viewer("t1");
      const m1 = viewer("m1");
      castBallots(vote);
      vote.snapshotDisclosureRecipients([t1, m1]);
      vote.evaluate(true);

      // In the snapshot, same socket object: gets it.
      vote.stateFor("t1", t1.socket).should.have.property("revealedBallots");
      // Not in the snapshot (t2 joined or was never connected).
      vote
        .stateFor("t2", { readyState: 1 })
        .should.not.have.property("revealedBallots");
      // Same id, a different socket object (reconnect), even with equal contents.
      vote
        .stateFor("t1", { readyState: 1 })
        .should.not.have.property("revealedBallots");
      // Same id, no socket at all.
      vote.stateFor("t1").should.not.have.property("revealedBallots");
      vote.stateFor("t1", null).should.not.have.property("revealedBallots");
      // Another recipient's socket does not work for this id.
      vote.stateFor("t1", m1.socket).should.not.have.property("revealedBallots");
      // They still get the normal finalized view.
      const outside = vote.stateFor("t2", { readyState: 1 });
      outside.finalized.should.equal(true);
      outside.disclosureVersion.should.equal(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Game wiring (stub game in the style of GameKudos.test.js)
// ---------------------------------------------------------------------------

function stubGame({ bots = [], spectatorIds = [] } = {}) {
  const events = []; // [{ to, event, data }] in the order they were sent
  const alerts = [];
  const mk = (id, alignment, spectator = false) => ({
    id,
    name: id.toUpperCase(),
    user: { id: `u-${id}` },
    role: { alignment },
    left: false,
    socket: { readyState: 1, id: `sock-${id}` },
    send(event, data) {
      events.push({ to: id, event, data });
    },
    sendAlert(msg) {
      events.push({ to: id, event: "alert", data: msg });
    },
  });
  const list = [
    mk("t1", "Village"),
    mk("t2", "Village"),
    mk("t3", "Village"),
    mk("m1", "Mafia"),
  ];
  for (const p of list)
    if (bots.includes(p.id)) {
      p.isBot = true;
      p.user = { id: `bot-${p.id}`, dev: true };
    }
  const players = new ArrayHash();
  for (const p of list) players.push(p);
  const spectators = spectatorIds.map((id) => mk(id, undefined, true));
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    id: "g",
    ranked: true,
    competitive: false,
    finished: true,
    postgameOver: false,
    timers: {},
    players,
    spectators,
    originalRoles: Object.fromEntries(list.map((p) => [p.id, "Villager"])),
    winners: {
      getWinnersInfo: () => ({
        groups: ["Village"],
        players: ["t1", "t2", "t3"],
      }),
    },
    sendAlert: (msg) => alerts.push(msg),
  });
  return { game, events, alerts, players, spectators };
}

const kudosTo = (events, id) =>
  events.filter((e) => e.to === id && e.event === "kudos");
const lastKudos = (events, id) => kudosTo(events, id).slice(-1)[0].data;

// KUDOS_FINAL_BALLOTS is read when the vote opens; put it back after each test.
let savedFlag;
let hadFlag;
function setFlag(value) {
  if (value === undefined) delete process.env.KUDOS_FINAL_BALLOTS;
  else process.env.KUDOS_FINAL_BALLOTS = value;
}
describe("Kudos final ballot reveal: Game", function () {
  beforeEach(function () {
    hadFlag = Object.prototype.hasOwnProperty.call(
      process.env,
      "KUDOS_FINAL_BALLOTS"
    );
    savedFlag = process.env.KUDOS_FINAL_BALLOTS;
  });
  afterEach(function () {
    setFlag(hadFlag ? savedFlag : undefined);
  });

  describe("startKudosVote and KUDOS_FINAL_BALLOTS", function () {
    it("creates version 0 when the variable is unset", function () {
      setFlag(undefined);
      const { game, events } = stubGame();
      game.startKudosVote();
      game.kudosVote.disclosureVersion.should.equal(0);
      lastKudos(events, "t1").should.not.have.property("disclosureVersion");
    });

    it('creates version 1 when it is "true" in a non-test-mode game', function () {
      setFlag("true");
      const { game, events } = stubGame();
      game.hasTestBots().should.equal(false);
      game.startKudosVote();
      game.kudosVote.disclosureVersion.should.equal(1);
      game.kudosVote.testMode.should.equal(false);
      lastKudos(events, "t1").disclosureVersion.should.equal(1);
    });

    it('creates version 0 when it is "true" but the game is in test mode', function () {
      setFlag("true");
      const { game } = stubGame({ bots: ["t3"] });
      game.scheduleBotKudosVotes = () => {};
      game.startKudosVote();
      game.kudosVote.testMode.should.equal(true);
      game.kudosVote.disclosureVersion.should.equal(0);
    });

    it('creates version 0 for any other value ("1", "false", "TRUE", "")', function () {
      for (const value of ["1", "false", "TRUE", ""]) {
        setFlag(value);
        const { game } = stubGame();
        game.startKudosVote();
        game.kudosVote.disclosureVersion.should.equal(0, `value ${value}`);
      }
    });

    it("keeps the version it was created with when the variable changes later", function () {
      setFlag("true");
      const { game } = stubGame();
      game.startKudosVote();
      setFlag(undefined);
      game.startKudosVote(); // already open: no-op
      game.kudosVote.disclosureVersion.should.equal(1);

      setFlag(undefined);
      const other = stubGame();
      other.game.startKudosVote();
      setFlag("true");
      other.game.kudosVote.disclosureVersion.should.equal(0);
    });
  });

  describe("castKudosVote on a version 1 vote", function () {
    beforeEach(function () {
      setFlag("true");
    });

    it("refuses and does not count the vote without disclosureVersion 1", function () {
      const { game, events, players } = stubGame();
      game.startKudosVote();
      for (const sent of [undefined, 0, 2, "1", true]) {
        const before = events.length;
        game.castKudosVote(players.t1, "Village", "t2", sent);
        const after = events.slice(before);
        after.should.deep.equal(
          [{ to: "t1", event: "alert", data: RELOAD_ALERT }],
          `disclosureVersion ${String(sent)}`
        );
      }
      should.not.exist(game.kudosVote.ballots.t1);
      game.kudosVote.tally("Village").counts.t2.should.equal(0);
    });

    it("counts the vote with disclosureVersion 1", function () {
      const { game, events, players } = stubGame();
      game.startKudosVote();
      game.castKudosVote(players.t1, "Village", "t2", undefined); // refused first
      game.castKudosVote(players.t1, "Village", "t2", 1);
      game.kudosVote.ballots.t1.should.deep.equal({ Village: "t2" });
      game.kudosVote.tally("Village").counts.t2.should.equal(1);
      const alertsSent = events.filter((e) => e.to === "t1" && e.event === "alert");
      alertsSent.map((e) => e.data).should.deep.equal([RELOAD_ALERT]);
      lastKudos(events, "t1").myVotes.should.deep.equal({ Village: "t2" });
    });

    it("does not need disclosureVersion on a version 0 vote", function () {
      setFlag(undefined);
      const { game, events, players } = stubGame();
      game.startKudosVote();
      game.kudosVote.disclosureVersion.should.equal(0);
      game.castKudosVote(players.t1, "Village", "t2");
      game.kudosVote.ballots.t1.should.deep.equal({ Village: "t2" });
      events
        .some((e) => e.event === "alert" && e.data === RELOAD_ALERT)
        .should.equal(false);
    });
  });

  describe("endPostgame on a version 1 game", function () {
    // Only the persistence pass (_doEndPostgame) is replaced: it needs the
    // database. The part under test, up to and including broadcast("finished"),
    // is the real code.
    function endable(stub) {
      stub.game._doEndPostgame = async () => {};
      return stub;
    }

    it("sends the final kudos state, with revealedBallots, to connected players and spectators before finished", async function () {
      setFlag("true");
      const s = endable(stubGame({ spectatorIds: ["s1"] }));
      const { game, events, players } = s;
      game.startKudosVote();
      game.castKudosVote(players.t1, "Village", "t2", 1);
      game.castKudosVote(players.t1, "Mafia", NO_ONE, 1);
      game.castKudosVote(players.t3, "Village", "t2", 1);
      // t3 leaves after voting: not a viewer any more, but the ballot stays.
      players.t3.left = true;
      game.kudosVoterLeft(players.t3);

      const mark = events.length;
      await game.endPostgame();
      const order = events.slice(mark).map((e) => `${e.to}:${e.event}`);

      const expected = [
        { row: "Village", voterId: "t1", targetId: "t2" },
        { row: "Village", voterId: "t3", targetId: "t2" },
        { row: "Mafia", voterId: "t1", targetId: NO_ONE },
      ];
      for (const id of ["t1", "t2", "m1", "s1"]) {
        const sentAfter = events.slice(mark);
        const k = sentAfter.findIndex(
          (e) => e.to === id && e.event === "kudos" && e.data.finalized
        );
        const f = sentAfter.findIndex(
          (e) => e.to === id && e.event === "finished"
        );
        k.should.be.greaterThan(-1, `${id} got a finalized kudos state`);
        f.should.be.greaterThan(-1, `${id} got finished`);
        k.should.be.lessThan(f, `${id}: kudos before finished`);
        sentAfter[k].data.revealedBallots.should.have.deep.members(expected);
        sentAfter[k].data.revealedBallots.should.have.length(expected.length);
      }
      // The player who left gets no kudos state (broadcast("finished") reaches
      // every seat; the real Player.send drops it for a player who left).
      order.should.not.include("t3:kudos");
      // No finished is sent before the last final kudos state.
      const firstFinished = order.findIndex((o) => o.endsWith(":finished"));
      const lastFinalKudos = events
        .slice(mark)
        .map((e, i) => (e.event === "kudos" && e.data.finalized ? i : -1))
        .reduce((a, b) => Math.max(a, b), -1);
      lastFinalKudos.should.be.lessThan(firstFinished);
      game.kudosVote.finalized.should.equal(true);
    });

    it("sends no kudos state at all around finished on a version 0 game", async function () {
      setFlag(undefined);
      const s = endable(stubGame());
      const { game, events, players } = s;
      game.startKudosVote();
      game.castKudosVote(players.t1, "Village", "t2");
      const mark = events.length;
      await game.endPostgame();
      const sentAfter = events.slice(mark);
      sentAfter.filter((e) => e.event === "kudos").should.deep.equal([]);
      sentAfter.filter((e) => e.event === "finished").length.should.equal(4);
      game.kudosVote.finalized.should.equal(false); // left to _doEndPostgame
    });

    it("still broadcasts finished if the final disclosure throws", async function () {
      setFlag("true");
      const s = endable(stubGame());
      const { game, events } = s;
      game.startKudosVote();
      game.evaluateKudos = () => {
        throw new Error("boom");
      };
      const mark = events.length;
      await game.endPostgame();
      events
        .slice(mark)
        .filter((e) => e.event === "finished")
        .length.should.equal(4);
    });
  });
});

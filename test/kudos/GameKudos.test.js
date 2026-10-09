const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const ArrayHash = require("../../Games/core/ArrayHash");
const { NO_ONE } = require("../../Games/core/Kudos");

// Drives the Game kudos methods on a stub game (no sockets / db).
function stubGame({
  ranked = true,
  groups = ["Village"],
  winnerIds,
  meteor,
  bots = [],
  devBots = true,
  guests = [],
} = {}) {
  const sent = {};
  const alerts = [];
  const mk = (id, alignment) => ({
    id,
    name: id.toUpperCase(),
    user: { id: `u-${id}` },
    role: { alignment },
    left: false,
    send(event, data) {
      (sent[id] = sent[id] || []).push([event, data]);
    },
    sendAlert(msg) {
      (sent[id] = sent[id] || []).push(["alert", msg]);
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
      // devBots: false seats these as guests instead.
      p.user = devBots
        ? { id: `bot-${p.id}`, dev: true }
        : { id: `guest-${p.id}`, guestId: `g-${p.id}` };
    }
  // Guests join with isBot set too (no account) plus a guestId.
  for (const p of list)
    if (guests.includes(p.id)) {
      p.isBot = true;
      p.user = { id: `guest-${p.id}`, guestId: `g-${p.id}` };
    }
  // Same container the real game uses (keyed by id, no array methods).
  const players = new ArrayHash();
  for (const p of list) players.push(p);
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    id: "g",
    ranked,
    competitive: false,
    finished: true,
    postgameOver: false,
    MeteorLanded: meteor,
    players,
    spectators: [],
    originalRoles: Object.fromEntries(list.map((p) => [p.id, "Villager"])),
    winners: {
      getWinnersInfo: () => ({
        groups,
        players: winnerIds || ["t1", "t2", "t3"],
      }),
    },
    sendAlert: (msg) => alerts.push(msg),
  });
  return { game, sent, alerts, players };
}

const last = (sent, id) =>
  (sent[id] || []).filter(([e]) => e === "kudos").slice(-1)[0][1];

describe("Game kudos integration", function () {
  it("opens kudos only for ranked/competitive real win/loss games", function () {
    let s = stubGame({ ranked: false });
    s.game.startKudosVote();
    should.not.exist(s.game.kudosVote);

    s = stubGame({ groups: ["No one"], winnerIds: [] });
    s.game.startKudosVote();
    should.not.exist(s.game.kudosVote);

    s = stubGame({ meteor: true });
    s.game.startKudosVote();
    should.not.exist(s.game.kudosVote);

    s = stubGame();
    s.game.startKudosVote();
    should.exist(s.game.kudosVote);
    last(s.sent, "t1")
      .rows.map((r) => r.label)
      .should.deep.equal(["Town", "Mafia"]);
  });

  it("rejects self votes with the alert and keeps the row open", function () {
    const { game, sent } = stubGame();
    game.startKudosVote();
    game.castKudosVote(game.players.t1, "Village", "t1");
    sent.t1
      .some(([e, m]) => e === "alert" && m === "You Cannot Kudo Yourself!")
      .should.equal(true);
    last(sent, "t1").myVotes.should.deep.equal({});
  });

  it("awards early, alerts once, and persists all receivers at the end", function () {
    const { game, alerts, sent, players } = stubGame();
    game.startKudosVote();
    game.castKudosVote(players.t1, "Mafia", "m1");
    game.castKudosVote(players.t2, "Mafia", "m1");
    alerts.should.deep.equal([]); // 2 vs 0 + 2 remaining (t3, m1)
    game.castKudosVote(players.t3, "Mafia", "m1");
    alerts.should.deep.equal(["M1 has received kudos!"]);
    last(sent, "t3").awarded.Mafia.should.deep.equal(["m1"]);
    // Other players' votes never show up.
    last(sent, "t3").myVotes.should.deep.equal({ Mafia: "m1" });

    // A leaver stops counting; then the lobby closes.
    game.castKudosVote(players.t1, "Village", "t2");
    game.castKudosVote(players.m1, "Village", "t2");
    players.t3.left = true;
    game.kudosVote.removeVoter("t3");
    game.evaluateKudos(false);
    game.evaluateKudos(true);
    alerts.should.deep.equal([
      "M1 has received kudos!",
      "T2 has received kudos!",
    ]);
    game.kudosVote.awardedIds().should.deep.equal(["t2", "m1"]);
  });

  it("locks votes", function () {
    const { game, sent, players } = stubGame();
    game.startKudosVote();
    game.castKudosVote(players.t1, "Village", NO_ONE);
    game.castKudosVote(players.t1, "Village", "t2");
    last(sent, "t1").myVotes.should.deep.equal({ Village: NO_ONE });
  });

  describe("bot test mode", function () {
    it("opens kudos in an unranked game with a dev bot, flagged as test mode", function () {
      const { game, sent } = stubGame({ ranked: false, bots: ["t3"] });
      game.scheduleBotKudosVotes = () => {};
      game.startKudosVote();
      should.exist(game.kudosVote);
      last(sent, "t1").testMode.should.equal(true);
      // Bots vote and can be voted for.
      game.kudosVote.voters.has("t3").should.equal(true);
      last(sent, "t3").canVote.should.equal(true);
    });

    it("does not open kudos in an unranked game with only guests", function () {
      const s = stubGame({ ranked: false, bots: ["t3"], devBots: false });
      s.game.startKudosVote();
      should.not.exist(s.game.kudosVote);
    });

    it("a guest is not a bot: no test mode, guest doesn't vote", function () {
      const { game, players } = stubGame({ guests: ["t3"] });
      game.hasTestBots().should.equal(false);
      game.countsForRankings().should.equal(true);
      game.startKudosVote();
      should.exist(game.kudosVote);
      game.kudosVote.testMode.should.equal(false);
      game.kudosVote.voters.has("t3").should.equal(false);
      game.castKudosVote(players.t1, "Mafia", "m1");
      game.castKudosVote(players.t2, "Mafia", "m1");
      game.evaluateKudos(true);
      game.kudosReceiverUserIds().should.deep.equal(["u-m1"]);
    });

    it("a guest plus a bot is test mode because of the bot", function () {
      const { game } = stubGame({ guests: ["t2"], bots: ["t3"] });
      game.scheduleBotKudosVotes = () => {};
      game.hasTestBots().should.equal(true);
      game.startKudosVote();
      game.kudosVote.testMode.should.equal(true);
      game.kudosVote.voters.has("t3").should.equal(true);
      game.kudosVote.voters.has("t2").should.equal(false);
    });

    it("counts bot votes and can award a bot", function () {
      const { game, alerts, sent, players } = stubGame({ bots: ["t2", "m1"] });
      game.scheduleBotKudosVotes = () => {};
      game.startKudosVote();
      game.castKudosVote(players.m1, "Village", "t2");
      game.castKudosVote(players.t1, "Village", "t2");
      game.castKudosVote(players.t3, "Village", "t2");
      alerts.should.deep.equal(["T2 has received kudos!"]);
      last(sent, "t1").awarded.Village.should.deep.equal(["t2"]);
      game.castKudosVote(players.t2, "Mafia", "m1");
      game.castKudosVote(players.t1, "Mafia", "m1");
      game.evaluateKudos(true);
      game.kudosVote.awardedIds().should.deep.equal(["t2", "m1"]);
    });

    it("persists nothing in a game with any bot", function () {
      const { game, players } = stubGame({ bots: ["t3"] });
      game.scheduleBotKudosVotes = () => {};
      game.startKudosVote();
      game.castKudosVote(players.t1, "Mafia", "m1");
      game.castKudosVote(players.t2, "Mafia", "m1");
      game.castKudosVote(players.t3, "Mafia", "m1");
      game.evaluateKudos(true);
      game.kudosVote.awardedIds().should.deep.equal(["m1"]);
      game.kudosReceiverUserIds().should.deep.equal([]);
      // Even a bot that left before the end keeps the game a test game.
      players.t3.left = true;
      game.kudosReceiverUserIds().should.deep.equal([]);
    });

    it("persists receivers' user ids in a game without bots", function () {
      const { game, players } = stubGame();
      game.startKudosVote();
      game.castKudosVote(players.t1, "Mafia", "m1");
      game.castKudosVote(players.t2, "Mafia", "m1");
      game.castKudosVote(players.t3, "Mafia", "m1");
      game.evaluateKudos(true);
      game.kudosVote.testMode.should.equal(false);
      game.kudosReceiverUserIds().should.deep.equal(["u-m1"]);
    });

    it("bots auto-vote once per row after a delay, never for themselves", function (done) {
      const { game, players } = stubGame({ bots: ["t2", "m1"] });
      game.scheduleBotKudosVotes = Game.prototype.scheduleBotKudosVotes;
      const realStart = game.scheduleBotKudosVotes;
      game.scheduleBotKudosVotes = function () {
        return realStart.call(this, 5, 20);
      };
      game.startKudosVote();
      setTimeout(() => {
        const ballots = game.kudosVote.ballots;
        Object.keys(ballots).sort().should.deep.equal(["m1", "t2"]);
        for (const bot of ["m1", "t2"]) {
          Object.keys(ballots[bot])
            .sort()
            .should.deep.equal(["Mafia", "Village"]);
          Object.values(ballots[bot]).should.not.include(bot);
        }
        should.not.exist(ballots.t1);
        game.clearBotKudosTimers();
        game.botKudosTimers.should.deep.equal([]);
        done();
      }, 80);
    });
  });
});

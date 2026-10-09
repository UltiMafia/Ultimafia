const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const { NO_ONE } = require("../../Games/core/Kudos");

// Drives the Game kudos methods on a stub game (no sockets / db).
function stubGame({ ranked = true, groups = ["Village"], winnerIds, meteor } = {}) {
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
  const players = list.slice();
  for (const p of list) players[p.id] = p;
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
    last(s.sent, "t1").rows.map((r) => r.label).should.deep.equal([
      "Town",
      "Mafia",
    ]);
  });

  it("rejects self votes with the alert and keeps the row open", function () {
    const { game, sent } = stubGame();
    game.startKudosVote();
    game.castKudosVote(game.players.t1, "Village", "t1");
    sent.t1.some(([e, m]) => e === "alert" && m === "You Cannot Kudo Yourself!")
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
});

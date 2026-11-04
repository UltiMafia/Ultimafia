const chai = require("chai");
const should = chai.should();
const Game = require("../../Games/core/Game");
const ArrayHash = require("../../Games/core/ArrayHash");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Drives the lobby timer methods on a stub game with the real Timer (no sockets / db).
function stubGame({ wait = 1, competitive = false } = {}) {
  const alerts = [];
  const sent = [];
  const kicked = [];
  const players = new ArrayHash();
  players.push({
    id: "p1",
    user: { id: "host" },
    send: (event, data) => sent.push([event, data]),
  });

  const game = Object.create(Game.prototype);
  Object.assign(game, {
    id: "g",
    started: false,
    competitive,
    pregameWaitLength: wait,
    pregameExtensions: 0,
    players,
    spectators: [],
    timers: {},
    devControls: {},
    getOptionsPayload: () => ({
      pregameExtensionsLeft: game.getPregameExtensionsLeft(),
    }),
    sendAlert: (msg) => alerts.push(msg),
    kickPlayer: async (p) => kicked.push(p.id),
  });
  game.startHostingTimer();

  return { game, alerts, sent, kicked };
}

function setTimeLeft(game, ms) {
  const timer = game.timers["pregameWait"];
  timer.delay = timer.timePassed() + ms;
}

describe("Pregame lobby extension", function () {
  let game;

  afterEach(function () {
    game.clearTimers();
  });

  it("is refused until the last minute of the lobby", function () {
    ({ game } = stubGame());
    game.canExtendPregameWait().should.equal(false);

    setTimeLeft(game, MINUTE + 1000);
    game.canExtendPregameWait().should.equal(false);

    setTimeLeft(game, MINUTE - 1000);
    game.canExtendPregameWait().should.equal(true);
  });

  it("adds 60 minutes to the time left and tells the lobby", function () {
    const stub = stubGame();
    game = stub.game;
    setTimeLeft(game, 30 * 1000);

    const oldTimer = game.timers["pregameWait"];
    game.extendPregameWait();

    oldTimer.done.should.equal(true);
    game.getTimeLeft("pregameWait").should.be.closeTo(HOUR + 30 * 1000, 1000);
    stub.alerts.should.include("The host extended the lobby by 60 minutes.");
    stub.sent
      .filter(([event]) => event === "options")
      .slice(-1)[0][1]
      .pregameExtensionsLeft.should.equal(4);
  });

  it("caps the lobby at 6 hours in total", function () {
    ({ game } = stubGame());
    game.getPregameExtensionsLeft().should.equal(5);

    for (let i = 0; i < 5; i++) {
      setTimeLeft(game, 30 * 1000);
      game.canExtendPregameWait().should.equal(true);
      game.extendPregameWait();
    }

    setTimeLeft(game, 30 * 1000);
    game.canExtendPregameWait().should.equal(false);
    game.clearTimers();

    ({ game } = stubGame({ wait: 4 }));
    game.getPregameExtensionsLeft().should.equal(2);
    game.clearTimers();

    ({ game } = stubGame({ wait: 6 }));
    game.getPregameExtensionsLeft().should.equal(0);
  });

  it("is refused in competitive games and once the game has started", function () {
    ({ game } = stubGame({ competitive: true }));
    setTimeLeft(game, 30 * 1000);
    game.canExtendPregameWait().should.equal(false);
    game.clearTimers();

    ({ game } = stubGame());
    setTimeLeft(game, 30 * 1000);
    game.started = true;
    game.canExtendPregameWait().should.equal(false);
  });

  it("saves a lobby during its final 30 seconds", async function () {
    const stub = stubGame();
    game = stub.game;

    game.timers["pregameWait"].end();
    stub.alerts.some((a) => a.startsWith("Waited too long")).should.equal(true);

    const closingTimer = game.timers["pregameWait"];
    game.canExtendPregameWait().should.equal(true);
    game.extendPregameWait();

    closingTimer.done.should.equal(true);
    game.timers["pregameWait"].should.not.equal(closingTimer);
    game.getTimeLeft("pregameWait").should.be.above(HOUR);
    stub.kicked.should.have.length(0);
  });

  it("is refused after the final 30 seconds run out", async function () {
    const stub = stubGame();
    game = stub.game;

    game.timers["pregameWait"].end();
    game.timers["pregameWait"].end();
    await new Promise((resolve) => setImmediate(resolve));

    stub.kicked.should.eql(["p1"]);
    game.canExtendPregameWait().should.equal(false);
    should.exist(game.timers["pregameWait"]);
  });
});

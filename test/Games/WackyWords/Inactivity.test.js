const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Loading core/Game normally starts the worker, Redis and DB connections.
// Execute the real Wacky classes with inert dependencies instead. No constructors
// or external services are needed for these speed-up/meeting/timer unit tests.
function load(file, dependencies, globals = {}) {
  const filename = path.resolve(__dirname, "../../../", file);
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(filename, "utf8"), {
    module,
    ...globals,
    require(request) {
      assert.ok(Object.hasOwn(dependencies, request), `Unexpected import: ${request}`);
      return dependencies[request];
    },
  }, { filename });
  return module.exports;
}

function fixture(state = "Night", options = {}) {
  let now = 0;
  let nextId = 0;
  const timeouts = new Map();
  const intervals = new Map();
  const Timer = load("Games/core/Timer.js", {
    "../../modules/logging": () => ({ error() {} }),
    "../../modules/gameContext": { run: (_context, fn) => fn() },
  }, {
    Date: { now: () => now },
    setTimeout(fn, delay) {
      const id = ++nextId;
      timeouts.set(id, { fn, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timeouts.delete(id),
    setInterval(fn) {
      const id = ++nextId;
      intervals.set(id, fn);
      return id;
    },
    clearInterval: (id) => intervals.delete(id),
  });
  const SpeedUpMeeting = load("Games/types/WackyWords/SpeedUpMeeting.js", {
    "../../core/Meeting": class {},
  });
  const Wacky = load("Games/types/WackyWords/Game.js", {
    "../../core/Game": class {},
    "./Player": class {},
    "./Action": class {},
    "../../core/Queue": class {},
    "../../../lib/Random": {},
    "../../core/Winners": class {},
    "../../core/ArrayHash": class {},
    "./data/questions": [],
    "./data/neighborQuestions": [],
    "./data/decisions": [],
    "./SpeedUpMeeting": SpeedUpMeeting,
  });
  const victims = [];
  let advances = 0;
  let pending;
  const game = Object.assign(Object.create(Wacky.prototype), {
    id: "wacky-inactivity",
    currentState: state === "Night" ? 0 : 1,
    finished: false,
    hasNeighbor: true,
    realAnswerer: "Alice",
    players: ["Alice", "Bob", "Carol", "Dave"].map((name) => ({
      id: name, name, alive: true, left: false,
    })),
    playerHasVoted: { Bob: true, Carol: true },
    getStateName: () => state,
    sendAlert() {},
    timers: {},
    createTimer(name, delay, then) {
      const timer = new Timer({ name, delay, then, game: this, clients: [] });
      this.timers[name] = timer;
      timer.start();
    },
    async vegPlayer(player) { victims.push(player.name); },
    gotoNextState() { advances++; },
    ...options,
  });
  const speedUp = game.speedUp.bind(game);
  game.speedUp = () => (pending = speedUp());
  const meeting = Object.assign(Object.create(SpeedUpMeeting.prototype), {
    game, finished: false, votes: { Bob: "Speed Up" },
  });
  return {
    game, meeting, victims, intervals, timeouts,
    advances: () => advances,
    async tick(ms) {
      now += ms;
      for (const [id, timeout] of timeouts) {
        if (timeout.at <= now) {
          timeouts.delete(id);
          timeout.fn();
        }
      }
      await pending;
    },
    startCountdown() {
      meeting.checkEnoughVoted();
      assert.equal(timeouts.size, 0, "one of four players is below threshold");
      meeting.votes.Carol = "Speed Up";
      meeting.checkEnoughVoted();
      meeting.checkEnoughVoted();
      assert.equal(timeouts.size, 1, "threshold starts exactly one countdown");
    },
  };
}

const ResponseGiver = require("../../../Games/types/WackyWords/roles/cards/ResponseGiver");
const TownCore = require("../../../Games/types/WackyWords/roles/cards/TownCore");

function canAct(Card, name, game, player) {
  const role = { game, player };
  return new Card(role).meetings[name].shouldMeet.call(role);
}

describe("Wacky People speed-up inactivity", function () {
  it("still requires every player's initial personal answer before an owner is selected", async function () {
    const h = fixture("Night", { realAnswerer: undefined, promptMode: true });
    assert.equal(canAct(ResponseGiver, "Give Response", h.game, h.game.players[0]), true);
    await h.game.speedUp();
    assert.deepEqual(h.victims, ["Alice", "Dave"]);
    assert.equal(h.advances(), 1);
  });

  for (const mode of [{}, { hasAlien: true }, { hasGovernor: true }, { hasGambler: true }]) {
    it(`preserves missing-action enforcement outside Wacky People: ${JSON.stringify(mode)}`, async function () {
      const h = fixture("Night", { hasNeighbor: false, ...mode });
      await h.game.speedUp();
      assert.deepEqual(h.victims, ["Alice", "Dave"]);
      assert.equal(h.advances(), 1);
    });
  }

  it("does not penalize dead or departed players", async function () {
    const h = fixture();
    h.game.players[3].alive = false;
    h.game.players[1].left = true;
    h.game.clearVoted();
    await h.game.speedUp();
    assert.deepEqual(h.victims, ["Carol"]);
  });

  it("accepts an action completed before countdown expiry", async function () {
    const h = fixture();
    h.startCountdown();
    await h.tick(4999);
    h.game.playerHasVoted.Dave = true;
    await h.tick(1);
    assert.deepEqual(h.victims, []);
    assert.equal(h.advances(), 1);
  });

  it("exempts the new owner after per-phase vote markers reset", async function () {
    const h = fixture("Day");
    h.game.clearVoted();
    h.game.realAnswerer = "Bob";
    h.game.playerHasVoted.Alice = true;
    h.game.playerHasVoted.Carol = true;
    await h.game.speedUp();
    assert.deepEqual(h.victims, ["Dave"]);
  });

  it("cancels a pending countdown, including an already-queued timeout callback", async function () {
    const h = fixture();
    h.startCountdown();
    const queued = [...h.timeouts.values()][0].fn;
    h.game.timers.speedUp.clear();
    h.game.currentState++;
    h.game.clearVoted();
    queued();
    await h.tick(5000);
    assert.deepEqual(h.victims, []);
    assert.equal(h.advances(), 0);
    assert.equal(h.timeouts.size, 0);
    assert.equal(h.intervals.size, 0);
  });

  it("does not run a countdown callback twice", async function () {
    const h = fixture();
    h.startCountdown();
    const queued = [...h.timeouts.values()][0].fn;
    await h.tick(5000);
    queued();
    assert.deepEqual(h.victims, ["Dave"]);
    assert.equal(h.advances(), 1);
  });

  it("ignores speed-up when the game has already finished", async function () {
    const h = fixture("Day", { finished: true });
    await h.game.speedUp();
    assert.deepEqual(h.victims, []);
    assert.equal(h.advances(), 0);
  });

  it("does not advance again if the final penalty changes the phase", async function () {
    const h = fixture();
    h.game.vegPlayer = async (player) => {
      h.victims.push(player.name);
      h.game.currentState++;
    };
    await h.game.speedUp();
    assert.deepEqual(h.victims, ["Dave"]);
    assert.equal(h.advances(), 0);
  });

  for (const change of ["phase", "finished"]) {
    it(`stops an already-running speed-up after the game ${change} changes`, async function () {
      const h = fixture();
      h.game.playerHasVoted = {};
      let release;
      const penalty = new Promise((resolve) => { release = resolve; });
      h.game.vegPlayer = async (player) => {
        h.victims.push(player.name);
        await penalty;
      };
      const running = h.game.speedUp();
      assert.deepEqual(h.victims, ["Bob"]);
      if (change === "phase") {
        h.game.currentState++;
        h.game.realAnswerer = "Carol";
        h.game.clearVoted();
      } else {
        h.game.finished = true;
      }
      release();
      await running;
      assert.deepEqual(h.victims, ["Bob"], "must not penalize any more players");
      assert.equal(h.advances(), 0, "must not advance the new phase/postgame");
    });
  }

  for (const [state, Card, name] of [
    ["Night", ResponseGiver, "Give Response"],
    ["Day", TownCore, "Pick Favorite Response"],
  ]) {
    it(`spares the actionless question owner but vegs an idle actor in ${state}`, async function () {
      const h = fixture(state);
      const [owner, responder] = h.game.players;
      assert.equal(canAct(Card, name, h.game, owner), false);
      assert.equal(canAct(Card, name, h.game, responder), true);
      assert.equal(h.game.playerHasVoted.Alice, undefined);
      h.startCountdown();
      await h.tick(4999);
      assert.deepEqual(h.victims, []);
      await h.tick(1);
      assert.deepEqual(h.victims, ["Dave"]);
      assert.equal(h.advances(), 1);
      assert.equal(h.intervals.size, 0);
    });
  }
});

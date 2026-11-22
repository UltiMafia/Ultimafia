require("dotenv").config();
const assert = require("node:assert/strict");
const EventEmitter = require("events");
const Mourned = require("../../../Games/types/Mafia/items/Mourned");
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const { TestSocket } = require("../../../lib/sockets");
const Random = require("../../../lib/Random");
const shortid = require("shortid");

// Public setup PmbbkaI_V. No account or live game is needed.
const setup = {
  id: "PmbbkaI_V",
  name: "Truer Crime Podcast",
  gameType: "Mafia",
  total: 9,
  startState: "Night",
  ForceMustAct: true,
  EventsPerNight: 1,
  GameEndEvent: "Meteor",
  noDeathLimit: 6,
  roles: [
    {
      "Cop:Exposed": 1,
      "Journalist:": 1,
      "Mourner:": 1,
      "Reanimator:Even": 1,
      "Villager:": 2,
      "Hooker:Restless": 1,
      "Informant:": 1,
      "Undertaker:": 1,
    },
  ],
};

function vote(player, name, selection) {
  const meeting = player.getMeetingByName(name);
  assert.ok(meeting, `${player.role.name} has ${name}`);
  // The socket handler delegates to this method but catches exceptions. Call
  // it directly so a state-transition exception cannot be silently swallowed.
  assert.notEqual(
    meeting.vote(player, selection),
    false,
    `${name}: valid vote`,
  );
}

async function makeGame() {
  const users = Array.from(
    { length: setup.total },
    () =>
      new User({
        id: shortid.generate(),
        name: shortid.generate(),
        socket: new TestSocket(),
        settings: {},
        isTest: true,
      }),
  );
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    isTest: true,
    settings: {
      setup: JSON.parse(JSON.stringify(setup)),
      stateLengths: { Day: 60000, Night: 60000 },
      pregameCountdownLength: 60000,
    },
  });
  await game.init();
  for (const user of users) await game.userJoin(user);
  game.clearTimer("pregameCountdown");
  await game.start();
  return game;
}

function assertPlayableDay(game) {
  assert.equal(game.getStateName(), "Day");
  assert.equal(game.finished, false);
  assert.ok(game.getMeetings().some((meeting) => meeting.name === "Village"));
  assert.ok(game.timers.main, "the day has a main clock (not --:--)");
  assert.equal(game.timers.main.done, false);
}

describe("Games/Mafia/Mourned", function () {
  it("expires during a state emit without aborting the remaining listeners", function () {
    const game = { events: new EventEmitter() };
    const holder = {
      game,
      alive: false,
      items: [],
      events: new EventEmitter(),
    };
    const item = new Mourned({
      mourner: {},
      question: "Was the Cop killed?",
      meetingName: "Answer Mourner",
    });
    holder.queueAlert = () => {};
    item.hold(holder);
    game.events.emit("state", { name: "Night" });
    assert.equal(item.lifespan, 0);
    assert.equal(item.holder, holder);

    let nextListenerRan = false;
    game.events.on("state", () => {
      nextListenerRan = true;
    });
    // Item.age runs before Mourned.state in the same emit. Removing a listener
    // during emit does not remove it from the emitter's in-flight snapshot.
    assert.doesNotThrow(() => game.events.emit("state", { name: "Day" }));
    assert.equal(item.holder, null);
    assert.deepEqual(holder.items, []);
    assert.equal(nextListenerRan, true);
  });

  it("only prompts a dead holder at night, not a revived holder or an expired item", function () {
    const alerts = [];
    const game = { events: new EventEmitter() };
    const holder = {
      game,
      alive: false,
      items: [],
      events: new EventEmitter(),
      queueAlert: (text) => alerts.push(text),
    };
    const item = new Mourned({
      mourner: {},
      question: "Was the Cop killed?",
      meetingName: "Answer",
    });
    item.hold(holder);
    item.listeners.state({ name: "Day" });
    assert.deepEqual(alerts, []);
    game.events.emit("state", { name: "Night" });
    assert.deepEqual(alerts, ["A mourner asks you: Was the Cop killed?"]);
    holder.alive = true;
    item.listeners.state({ name: "Night" });
    assert.equal(alerts.length, 1);
    game.events.emit("state", { name: "Day" });
    assert.equal(item.holder, null);
    assert.doesNotThrow(() => game.events.emit("state", { name: "Night" }));
    assert.equal(alerts.length, 1);
  });

  const scenarios = [
    {
      name: "reported visits, last Yes answer advances night",
      target: "Mourner",
      ask: true,
      answer: "Yes",
    },
    {
      name: "reported visits, unanswered question and phase-clock expiry",
      target: "Mourner",
      ask: true,
      answer: null,
    },
    {
      name: "Informant visits Villager instead, last No answer advances night",
      target: "Villager",
      ask: true,
      answer: "No",
    },
    { name: "Mourner does not ask a question", target: "Mourner", ask: false },
  ];
  for (const scenario of scenarios) {
    it(`starts a playable day: ${scenario.name}`, async function () {
      this.timeout(10000);
      await db.promise;
      await redis.client.flushdbAsync();
      const previousRng = Random._rng;
      Random.seed(1);
      let game;
      try {
        game = await makeGame();
        const role = (name) =>
          [...game.players].find((p) => p.role.name === name);
        const cop = role("Cop");
        const mourner = role("Mourner");
        const informant = role("Informant");
        const journalist = role("Journalist");
        assert.equal(game.getStateName(), "Night");
        vote(journalist, "Receive Reports", informant.id);
        vote(informant, "Receive Reports", cop.id);
        vote(cop, "Investigate", informant.id);
        for (const player of game.players) {
          if (player.role.alignment === "Mafia")
            vote(player, "Mafia Kill", cop.id);
        }
        if (game.getStateName() === "Night") game.timers.main.end();
        assertPlayableDay(game);
        assert.equal(cop.alive, false, "the actual mafia kill kills the Cop");
        if (scenario.ask)
          vote(mourner, "Ask Question", "Was the Cop killed by the mafia?");
        for (const player of game.alivePlayers()) vote(player, "Village", "*");
        if (game.getStateName() === "Dusk")
          vote(role("Undertaker"), "Clean Condemnation", "No");
        assert.equal(game.getStateName(), "Night");
        const item = cop.items.find((item) => item.name === "Mourned");
        if (scenario.ask) {
          assert.ok(item, "the question gives the dead Cop a Mourned item");
          assert.equal(item.lifespan, 0);
          assert.ok(cop.getMeetingByName(item.meetingName));
        } else {
          assert.equal(item, undefined);
        }
        vote(informant, "Receive Reports", role(scenario.target).id);
        vote(journalist, "Receive Reports", informant.id);
        const villager = role("Villager");
        vote(role("Reanimator"), "Give Syringe", villager.id);
        for (const player of game.players) {
          if (player.alive && player.role.alignment === "Mafia")
            vote(player, "Mafia Kill", villager.id);
        }
        if (scenario.ask) {
          assert.equal(
            game.getStateName(),
            "Night",
            "the dead Cop still needs to answer",
          );
          if (scenario.answer) {
            vote(cop, item.meetingName, scenario.answer);
          } else {
            // Drive the actual Timer.end -> gotoNextState path synchronously.
            game.timers.main.end();
          }
          assert.equal(item.holder, null);
          assert.equal(cop.items.includes(item), false);
          assert.equal(
            mourner.role.mournerYes,
            scenario.answer === "Yes" ? 1 : 0,
          );
          assert.equal(
            mourner.role.mournerNo,
            scenario.answer === "No" ? 1 : 0,
          );
        }
        assertPlayableDay(game);
        assert.equal(game.getStateInfo().name, "Day 2");
        if (item)
          assert.equal(cop.getMeetingByName(item.meetingName), undefined);
        // The new day is usable, not just announced before an aborted transition.
        vote(mourner, "Ask Question", "Another question?");
        for (const player of game.alivePlayers()) vote(player, "Village", "*");
        if (game.getStateName() === "Dusk")
          vote(role("Undertaker"), "Clean Condemnation", "No");
        assert.equal(game.getStateName(), "Night");
        assert.ok(game.timers.main);
      } finally {
        Random._rng = previousRng;
        if (game) {
          game.finished = true;
          game.clearTimers();
        }
      }
    });
  }
});

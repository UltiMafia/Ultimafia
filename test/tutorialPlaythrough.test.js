// Every tutorial storyline, hosted through POST /tutorial/host and played to
// the end by the human through the player socket (the events the browser
// sends), acting only on what the client is shown: the tutorial box's Next /
// Continue, the highlighted meeting and player, and the example chat line.
//
// The site can run several game servers. One that runs code from before the
// tutorial treats a tutorial like a normal lobby: no bots, and the lobby
// closes 30 seconds later. Game servers are picked in turn, so a player could
// get that lobby for some storylines and not others.
require("dotenv").config();
const { expect } = require("chai");
const db = require("../db/db");
const redis = require("../modules/redis");
const { games } = require("../Games/games");
const Game = require("../Games/types/Mafia/Game");
const User = require("../Games/core/User");
const { TestSocket } = require("../lib/sockets");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const routeUtils = require("../routes/utils");
const router = require("../routes/game");
const tutorialSetup = require("../Games/core/tutorial/setup");
const { ROSTER } = require("../Games/core/tutorial/cast");

if (!process.env.GAME_CREATION_TIMEOUT)
  process.env.GAME_CREATION_TIMEOUT = "20000";

const STORYLINES = ["cop", "journalist", "lawyer", "janitor", "sheriff"];
const FAST = {
  chat: 0,
  beat: 5,
  silence: 60000,
  idle: 60000,
  vote: [0, 2],
  fastVote: [0, 2],
};

function routeHandler(path) {
  return router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods.post,
  ).route.stack[0].handle;
}

function res() {
  return {
    statusCode: 200,
    body: null,
    status(c) {
      this.statusCode = c;
      return this;
    },
    send(b) {
      this.body = b;
      this.headersSent = true;
      return this;
    },
    sendStatus(c) {
      this.statusCode = c;
      this.headersSent = true;
      return this;
    },
    json(b) {
      this.body = b;
      this.headersSent = true;
      return this;
    },
  };
}

// The human in the browser: reacts only to what the server sends them.
function playAsHuman(game, userId, name, prefer) {
  const socket = new TestSocket();
  const user = new User({
    id: userId,
    name,
    socket,
    settings: {},
    isTest: true,
  });
  const meetings = {};
  const players = {};
  const out = { done: false, failed: false, stuck: null, steps: 0 };
  let last = null;

  socket.onClientEvent("players", (ps) => Object.assign(players, ps));
  socket.onClientEvent("state", () => {
    for (const k in meetings) delete meetings[k];
  });
  socket.onClientEvent("meeting", (m) => (meetings[m.id] = m));
  socket.onClientEvent("leftMeeting", (id) => delete meetings[id]);
  socket.onClientEvent("tutorialPhase", (d) => {
    if (d && d.canContinue)
      setTimeout(() => socket.sendToServer("tutorialContinue"), 1);
  });
  out.texts = [];
  socket.onClientEvent("tutorial", (d) => {
    last = d;
    out.steps++;
    if (d && d.text) out.texts.push(String(d.text));
    if (d.done) {
      out.done = true;
      out.failed = !!d.failed;
      return;
    }
    if (d.hasNext) setTimeout(() => socket.sendToServer("tutorialNext"), 1);
    if (d.action) schedule(d, 0);
  });

  // Like a player, try again if the step hasn't moved (a line sent during
  // the chat cooldown is dropped).
  function schedule(d, n) {
    setTimeout(
      () => {
        if (last !== d || out.done) return;
        act(d);
        if (n < 4) schedule(d, n + 1);
      },
      n === 0 ? 3 : 1200,
    );
  }

  const nameOf = (id) => (players[id] && players[id].name) || id;
  const mine = () => Object.values(meetings).filter((m) => m.amMember);
  function act(d) {
    if (last !== d) return;
    const votes = (d.highlight || []).filter((h) => h.meeting);
    if (votes.length) {
      // A test can pick another highlighted choice (or a wrong one), like a
      // player who decides differently.
      const h =
        (prefer && prefer(d, votes)) || votes.find((x) => x.target) || votes[0];
      const m = mine().find((x) => x.name === h.meeting && x.voting);
      if (!m) return (out.stuck = `no "${h.meeting}" meeting shown`);
      const targets = Array.isArray(m.targets) ? m.targets : [];
      const taken = votes.filter((x) => x.target).map((x) => x.target);
      // The tutorial points at a name; if two choices carry that name the
      // player can't tell which one is meant (e.g. the player and a bot are
      // both "Z"), so don't guess.
      const named = h.target
        ? targets.filter((t) => nameOf(t) === h.target)
        : [];
      if (named.length > 1)
        return (out.stuck = `"${h.target}" is ${named.length} different choices in ${m.name}`);
      const sel = h.target
        ? named[0] || (h.target === "No one" ? "*" : null)
        : targets.find(
            (t) =>
              players[t] &&
              !taken.includes(nameOf(t)) &&
              players[t].userId !== userId,
          );
      if (!sel) return (out.stuck = `"${h.target}" not offered in ${m.name}`);
      socket.sendToServer("vote", { meetingId: m.id, selection: sel });
      return;
    }
    if (d.examples && d.examples.length) {
      const speech = mine().filter((x) => x.speech && x.canTalk !== false);
      const m =
        speech.find((x) => x.name === "Village") ||
        speech.find((x) => x.name === "Mafia") ||
        speech[0];
      if (!m) return (out.stuck = "no chat shown");
      socket.sendToServer("speak", { meetingId: m.id, content: d.examples[0] });
      return;
    }
    out.stuck = "an action step with nothing to click";
  }

  out.join = game.userJoin(user, false);
  out.last = () => last;
  return out;
}

async function until(fn, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, 20));
  }
  return false;
}

describe("Tutorial playthrough (every storyline, through the host route)", function () {
  this.timeout(120000);

  const hostTutorial = routeHandler("/tutorial/host");
  const orig = {};
  let created;
  let serverCalls;
  let staleEvery;
  let seq = 0;

  before(async function () {
    await db.promise;
    orig.createGame = gameLoadBalancer.createGame;
    orig.cancelGame = gameLoadBalancer.cancelGame;
    orig.ports = redis.getAllGameServerPorts;
    orig.verifyPermission = routeUtils.verifyPermission;

    // Two game servers, picked in turn. With staleEvery = 2, every other
    // create lands on a server from before the tutorial, which ignores
    // settings.tutorial like any unknown setting.
    redis.getAllGameServerPorts = async () => [3010, 3011];
    gameLoadBalancer.createGame = async (hostId, gameType, settings) => {
      serverCalls++;
      const stale = staleEvery && serverCalls % staleEvery === 0;
      seq += 1;
      const id = `tutplay${seq}${Date.now()}`;
      const s = Object.assign({}, settings, { pregameCountdownLength: 0 });
      if (stale) delete s.tutorial;
      else if (s.tutorial)
        s.tutorial = Object.assign({}, s.tutorial, { timing: FAST });
      const game = new Game({
        id,
        hostId,
        port: stale ? 3011 : 3010,
        settings: s,
      });
      games[id] = game;
      await game.init();
      created.push({ game, stale });
      return id;
    };
    gameLoadBalancer.cancelGame = async (uid, gameId) => {
      const game = games[gameId];
      if (!game) throw new Error(`Unable to cancel game ${gameId}.`);
      if (game.tutorial) {
        game.tutorial.destroy();
        game.clearTimers();
      }
      await game.cancel();
    };
    routeUtils.verifyPermission = async (...args) => args.includes("playGame");
  });

  after(function () {
    gameLoadBalancer.createGame = orig.createGame;
    gameLoadBalancer.cancelGame = orig.cancelGame;
    redis.getAllGameServerPorts = orig.ports;
    routeUtils.verifyPermission = orig.verifyPermission;
  });

  beforeEach(function () {
    created = [];
    serverCalls = 0;
  });

  afterEach(async function () {
    for (const { game } of created) {
      try {
        if (game.tutorial) game.tutorial.destroy();
        game.clearTimers();
        if (games[game.id]) await game.cancel();
      } catch (e) {}
    }
  });

  async function playStoryline(storyline, { data, prefer, humanName } = {}) {
    seq += 1;
    const userId = `tutplayer${seq}${Date.now()}`;
    await redis.leaveGame(userId);
    const r = res();
    await hostTutorial(
      { session: { user: { id: userId } }, body: { storyline } },
      r,
    );
    expect(
      r.statusCode,
      `${storyline}: host ${JSON.stringify(r.body)}`,
    ).to.equal(200);
    const game = games[r.body];
    expect(game, `${storyline}: game exists`).to.be.ok;

    if (data) Object.assign(game.tutorial.data, data);
    const human = playAsHuman(
      game,
      userId,
      humanName || "Newbie",
      prefer && ((d, votes) => prefer(d, votes, game.tutorial)),
    );
    await human.join;
    const seated = game.players.length;
    const ok = await until(
      () => human.done || human.stuck || (game.finished && human.done),
      60000,
    );
    const last = human.last();
    const result = {
      storyline,
      seated,
      done: human.done,
      failed: human.failed,
      stuck: human.stuck,
      finished: !!game.finished,
      last: last && String(last.text).slice(0, 160),
      branch: game.tutorial && game.tutorial.branch,
      log: game.tutorial ? game.tutorial.log.slice() : [],
      winners: game.winners ? Object.keys(game.winners.groups) : [],
      names: game.tutorial.players().map((p) => p.name),
      humanName: (game.tutorial.players().find((p) => p.user && p.user.id === userId) || {}).name,
      texts: human.texts.slice(),
      dead: game.tutorial
        ? Object.keys(game.tutorial.cast).filter((key) => {
            const p = game.tutorial.player(key);
            return p && !p.alive;
          })
        : [],
    };
    await redis.leaveGame(userId);
    return { ok, result, userId, game };
  }

  for (const storyline of STORYLINES) {
    it(`${storyline}: the player gets all 8 bots and finishes the tutorial`, async function () {
      staleEvery = 0;
      const { result } = await playStoryline(storyline);
      expect(result.seated, JSON.stringify(result)).to.equal(
        tutorialSetup.total,
      );
      expect(result.stuck, JSON.stringify(result)).to.equal(null);
      expect(result.done && !result.failed, JSON.stringify(result)).to.equal(
        true,
      );
      expect(result.finished, JSON.stringify(result)).to.equal(true);
    });
  }

  // Every branch of every storyline, with what the story says happens.
  const shoot = (key) => (d, votes, t) =>
    /^Your choice\b/.test(d.text)
      ? { meeting: "Shoot Gun", target: t.nameOf(key) }
      : null;
  const BRANCHES = [
    {
      name: "sheriff: shooting the Lawyer the real Cop (Z) reported guilty is right; the town then lynches the fake Cop (Gauss) and wins",
      storyline: "sheriff",
      prefer: shoot("lawyer"),
      branch: "shootGuilty",
      winner: "Village",
      dead: ["lawyer", "janitor", "mafioso"],
      log: ["human chose shootGuilty", "vote v1@Village -> janitor"],
    },
    {
      name: "sheriff: shooting the fake Cop wins",
      storyline: "sheriff",
      prefer: shoot("janitor"),
      branch: "shootFake",
      winner: "Village",
    },
    {
      name: "sheriff: shooting the real Cop loses the game for town (not a failed run)",
      storyline: "sheriff",
      prefer: shoot("cop"),
      branch: "shootReal",
      winner: "Mafia",
    },
    {
      name: "sheriff: holding the shot wins",
      storyline: "sheriff",
      prefer: (d, votes, t) =>
        /^Your choice\b/.test(d.text)
          ? { meeting: "Village", target: t.nameOf("lawyer") }
          : null,
      branch: "wait",
      winner: "Village",
    },
    {
      name: "sheriff: a blind shot at a Villager still ends the run",
      storyline: "sheriff",
      prefer: shoot("v1"),
      failed: true,
      log: ["bad shootRandom"],
    },
    {
      name: "sheriff: a blind shot that happens to hit the Mafioso still ends the run",
      storyline: "sheriff",
      prefer: shoot("mafioso"),
      failed: true,
      log: ["bad shootRandom"],
    },
    { name: "cop", storyline: "cop", winner: "Village" },
    {
      name: "journalist: reading the Cop",
      storyline: "journalist",
      data: { target: "cop" },
      winner: "Village",
    },
    {
      name: "journalist: reading the Janitor",
      storyline: "journalist",
      data: { target: "janitor" },
      winner: "Village",
    },
  ]
    .concat(
      ["cop", "journalist", "v1", "v2"].map((victim) => ({
        name: `lawyer: the Mafia kills the ${victim}`,
        storyline: "lawyer",
        data: { victim },
        winner: "Mafia",
      })),
    )
    .concat(
      ["cop", "journalist", "sheriff", "v1"].map((victim) => ({
        name: `janitor: cleaning the ${victim}`,
        storyline: "janitor",
        data: { victim },
        winner: "Mafia",
        // The Journalist who calls out the clean really read the Janitor.
        log: victim === "cop" ? ["vote journalist@Receive Reports -> janitor"] : [],
      })),
    );

  for (const c of BRANCHES) {
    it(`branch: ${c.name}`, async function () {
      staleEvery = 0;
      const { result } = await playStoryline(c.storyline, c);
      const why = JSON.stringify(Object.assign({}, result, { log: result.log.slice(-12) }));
      expect(result.stuck, why).to.equal(null);
      expect(result.done, why).to.equal(true);
      for (const line of c.log || [])
        expect(result.log, why).to.include(line);
      if (c.failed) {
        expect(result.failed, why).to.equal(true);
        return;
      }
      expect(result.failed, why).to.equal(false);
      expect(result.finished, why).to.equal(true);
      expect(result.log.some((l) => l.startsWith("fail ")), why).to.equal(false);
      if (c.branch) expect(result.branch, why).to.equal(c.branch);
      if (c.winner) expect(result.winners, why).to.include(c.winner);
      for (const key of c.dead || []) expect(result.dead, why).to.include(key);
    });
  }

  // The player's own name must never matter, even when it is a cast bot's
  // name (Vinman's account "Z" joined with the bot "Z").
  const CLASH_NAMES = ROSTER.map((r) => r.name).concat([
    "z", // another case of a bot name
    "GAUSS",
    "Zbot", // the name a clashing bot is shown under
  ]);
  for (const humanName of CLASH_NAMES) {
    for (const storyline of STORYLINES) {
      it(`name clash: a player named "${humanName}" finishes ${storyline}, and every name in the game is distinct`, async function () {
        staleEvery = 0;
        const { result } = await playStoryline(storyline, { humanName });
        const why = JSON.stringify(Object.assign({}, result, { log: result.log.slice(-12), texts: result.texts.slice(-4) }));
        expect(result.seated, why).to.equal(tutorialSetup.total);
        expect(result.humanName, why).to.equal(humanName);
        const lower = result.names.map((n) => n.toLowerCase());
        expect(new Set(lower).size, why).to.equal(result.names.length);
        expect(result.stuck, why).to.equal(null);
        expect(result.done && !result.failed, why).to.equal(true);
        expect(result.finished, why).to.equal(true);
        expect(result.log.some((l) => l.startsWith("fail ")), why).to.equal(false);
      });
    }
  }

  for (const humanName of ["Z", "sure", "Gauss"]) {
    it(`name clash: the Sheriff named "${humanName}" shoots the Lawyer the real Cop reported guilty, and the steps name the bots as shown`, async function () {
      staleEvery = 0;
      let cast;
      const { result, game } = await playStoryline("sheriff", {
        humanName,
        prefer: (d, votes, t) => {
          cast = { cop: t.nameOf("cop"), lawyer: t.nameOf("lawyer"), janitor: t.nameOf("janitor") };
          return shoot("lawyer")(d, votes, t);
        },
      });
      const why = JSON.stringify(Object.assign({}, result, { log: result.log.slice(-12), texts: result.texts.slice(-4) }));
      expect(result.stuck, why).to.equal(null);
      expect(result.done && !result.failed && result.finished, why).to.equal(true);
      expect(result.branch, why).to.equal("shootGuilty");
      expect(result.winners, why).to.include("Village");
      for (const key of ["lawyer", "janitor", "mafioso"]) expect(result.dead, why).to.include(key);
      // The choice step names the bots by the names the player sees, none of
      // which is the player's own.
      const choice = result.texts.find((t) => /^Your choice\b/.test(t));
      expect(choice, why).to.be.a("string");
      for (const name of Object.values(cast)) {
        expect(name.toLowerCase(), why).to.not.equal(humanName.toLowerCase());
        expect(result.names, why).to.include(name);
        expect(choice, why).to.include(name);
      }
    });
  }

  it("every storyline still finishes when one of the game servers runs code from before the tutorial", async function () {
    // The stale server gets every other game, whatever the storyline.
    staleEvery = 2;
    const results = [];
    for (const storyline of STORYLINES) {
      const { result } = await playStoryline(storyline);
      results.push(result);
    }
    const summary = JSON.stringify(results, null, 1);
    for (const r of results) {
      expect(r.seated, summary).to.equal(tutorialSetup.total);
      expect(r.done && !r.failed && r.finished, summary).to.equal(true);
    }
    // Lobbies the stale server made were closed, not left open.
    for (const { game, stale } of created)
      if (stale)
        expect(games[game.id], "stale lobby closed").to.equal(undefined);
    expect(
      created.some((c) => c.stale),
      "the stale server was used",
    ).to.equal(true);
  });

  it("gives tutorial lobbies a real hosting timer, not one that closes them after 30 seconds", async function () {
    staleEvery = 0;
    seq += 1;
    const userId = `tutplayer${seq}${Date.now()}`;
    await redis.leaveGame(userId);
    const r = res();
    await hostTutorial(
      { session: { user: { id: userId } }, body: { storyline: "cop" } },
      r,
    );
    expect(r.statusCode).to.equal(200);
    const game = games[r.body];
    // Nobody has joined yet; the lobby must not be scheduled to close.
    expect(
      Number.isFinite(game.pregameWaitLength),
      String(game.pregameWaitLength),
    ).to.equal(true);
    expect(game.pregameWaitLength).to.be.greaterThan(0);
    const timer = game.timers && game.timers.pregameWait;
    expect(timer, "hosting timer").to.be.ok;
    expect(
      timer.delay || timer.length || timer._delay || 3600000,
    ).to.be.greaterThan(60000);
    await redis.leaveGame(userId);
  });
});

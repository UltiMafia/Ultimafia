// Play again / Rehost on a tutorial: the old tutorial lobby is closed and a
// new one starts, with no cooldown between tutorials.
require("dotenv").config();
const { expect } = require("chai");
const db = require("../db/db");
const redis = require("../modules/redis");
const { games } = require("../Games/games");
const Game = require("../Games/types/Mafia/Game");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const routeUtils = require("../routes/utils");
const router = require("../routes/game");
const tutorialSetup = require("../Games/core/tutorial/setup");

if (!process.env.GAME_CREATION_TIMEOUT) process.env.GAME_CREATION_TIMEOUT = "20000";

function routeHandler(path) {
  return router.stack.find((l) => l.route && l.route.path === path && l.route.methods.post)
    .route.stack[0].handle;
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

function stop(game) {
  try {
    if (game.tutorial) game.tutorial.destroy();
    game.clearTimers();
  } catch (e) {}
}

describe("Tutorial Play again", function () {
  this.timeout(60000);

  const hostTutorial = routeHandler("/tutorial/host");
  const host = routeHandler("/host");
  const orig = {};
  let seq = 0;
  let userId;
  let created;
  let cancelled;
  let createDelay;

  before(async function () {
    await db.promise;
    orig.createGame = gameLoadBalancer.createGame;
    orig.cancelGame = gameLoadBalancer.cancelGame;
    orig.verifyPermission = routeUtils.verifyPermission;

    // What the game server does for createGame / cancelGame, in process.
    gameLoadBalancer.createGame = async (hostId, gameType, settings) => {
      if (createDelay) await new Promise((r) => setTimeout(r, createDelay));
      seq += 1;
      const id = `tutagain${seq}${Date.now()}`;
      const game = new Game({ id, hostId, port: 3010, settings });
      games[id] = game;
      await game.init();
      created.push(game);
      return id;
    };
    gameLoadBalancer.cancelGame = async (uid, gameId) => {
      cancelled.push(gameId);
      const game = games[gameId];
      if (!game) throw new Error(`Unable to cancel game ${gameId}.`);
      if (game.tutorial) {
        game.tutorial.destroy();
        game.clearTimers();
      }
      await game.cancel();
    };
    // A normal player: may play, but has cooldowns.
    routeUtils.verifyPermission = async (...args) => args.includes("playGame");
  });

  after(function () {
    gameLoadBalancer.createGame = orig.createGame;
    gameLoadBalancer.cancelGame = orig.cancelGame;
    routeUtils.verifyPermission = orig.verifyPermission;
  });

  beforeEach(async function () {
    seq += 1;
    userId = `tutagainuser${seq}${Date.now()}`;
    created = [];
    cancelled = [];
    createDelay = 0;
  });

  afterEach(async function () {
    for (const g of created) {
      stop(g);
      if (games[g.id]) await g.cancel();
    }
    await redis.leaveGame(userId);
  });

  function startTutorial(storyline = "cop") {
    const r = res();
    return hostTutorial({ session: { user: { id: userId } }, body: { storyline } }, r).then(() => r);
  }

  it("records the tutorial on the lobby so the site can recognise it", async function () {
    const r = await startTutorial("journalist");
    expect(r.statusCode).to.equal(200);
    const info = await redis.getGameInfo(r.body, true);
    expect(info.settings.tutorial).to.deep.equal({ storyline: "journalist" });
    expect(info.players.length).to.equal(tutorialSetup.total);
  });

  it("closes the old tutorial lobby and starts a new one while the player is still in it", async function () {
    const first = await startTutorial();
    expect(first.statusCode).to.equal(200);
    expect(await redis.inGame(userId)).to.equal(first.body);

    // Play again without leaving first (or before the leave has landed).
    const second = await startTutorial();
    expect(second.statusCode, JSON.stringify(second.body)).to.equal(200);
    expect(second.body).to.not.equal(first.body);
    expect(cancelled).to.deep.equal([first.body]);
    expect(games[first.body]).to.equal(undefined);
    expect(await redis.gameExists(first.body)).to.not.be.ok;
    expect(await redis.inGame(userId)).to.equal(second.body);
  });

  it("starts a new tutorial when the old one is already gone but the player still looks in it", async function () {
    const first = await startTutorial();
    const old = games[first.body];
    // The game server dropped the game, but the in-game flag is still set
    // (its leave had not finished when Play again was clicked).
    stop(old);
    delete games[first.body];

    const second = await startTutorial();
    expect(second.statusCode, JSON.stringify(second.body)).to.equal(200);
    expect(await redis.inGame(userId)).to.equal(second.body);
    await redis.deleteGame(first.body);
  });

  it("starts a new tutorial when the old lobby is fully gone and only the flag is left", async function () {
    await redis.client.setAsync(`user:${userId}:game`, "tutagain-gone");
    const r = await startTutorial();
    expect(r.statusCode, JSON.stringify(r.body)).to.equal(200);
    expect(await redis.inGame(userId)).to.equal(r.body);
  });

  it("still asks the player to leave a normal game first", async function () {
    const other = `tutagain-normal${Date.now()}`;
    await redis.createGame(other, {
      type: "Mafia",
      port: 3010,
      status: "Open",
      hostId: "someone-else",
      lobby: "Main",
      settings: { setup: "x", total: 3 },
      createTime: Date.now(),
    });
    await redis.joinGame(userId, other, false, false);

    const r = await startTutorial();
    expect(r.statusCode).to.equal(409);
    expect(created).to.have.lengthOf(0);
    expect(await redis.inGame(userId)).to.equal(other);
    await redis.deleteGame(other);
  });

  it("has no 30-second cooldown between tutorials and does not use up the hosting cooldown", async function () {
    for (let i = 0; i < 3; i++) {
      const r = await startTutorial(i == 1 ? "lawyer" : "cop");
      expect(r.statusCode, `start ${i + 1}: ${JSON.stringify(r.body)}`).to.equal(200);
    }
    expect(created).to.have.lengthOf(3);
    expect(await redis.client.existsAsync(`user:${userId}:rateLimit:hostGame`)).to.equal(0);
  });

  it("starts only one tutorial when two starts arrive at once", async function () {
    createDelay = 200;
    const [a, b] = await Promise.all([startTutorial(), startTutorial()]);
    const codes = [a.statusCode, b.statusCode].sort();
    expect(codes).to.deep.equal([200, 409]);
    expect(created).to.have.lengthOf(1);
    expect(await redis.inGame(userId)).to.equal(created[0].id);
    // and the lock is released afterwards
    createDelay = 0;
    const again = await startTutorial();
    expect(again.statusCode).to.equal(200);
  });

  it("Rehost on a tutorial acts like Play again", async function () {
    const first = await startTutorial("sheriff");
    const r = res();
    await host(
      {
        session: { user: { id: userId } },
        body: { rehost: first.body, gameType: "Mafia", setup: tutorialSetup.id, lobby: "Main" },
      },
      r
    );
    expect(r.statusCode, JSON.stringify(r.body)).to.equal(200);
    expect(r.body).to.not.equal(first.body);
    expect(games[first.body]).to.equal(undefined);
    const info = await redis.getGameInfo(r.body, true);
    expect(info.settings.tutorial).to.deep.equal({ storyline: "sheriff" });
    expect(info.players.length).to.equal(tutorialSetup.total);
    expect(await redis.inGame(userId)).to.equal(r.body);
  });

  it("refuses to rehost a tutorial it cannot identify instead of failing on its setup", async function () {
    const r = res();
    await host(
      {
        session: { user: { id: userId } },
        body: { rehost: "tutagain-missing", gameType: "Mafia", setup: tutorialSetup.id, lobby: "Main" },
      },
      r
    );
    expect(r.statusCode).to.equal(400);
    expect(String(r.body)).to.match(/Play again/);
    expect(created).to.have.lengthOf(0);
  });
});

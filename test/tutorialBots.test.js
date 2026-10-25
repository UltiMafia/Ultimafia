// The tutorial game must not reach the player without its bots: a failed bot
// join closes the game and fails the create request.
require("dotenv").config();
const { expect } = require("chai");
const db = require("../db/db");
const redis = require("../modules/redis");
const { games } = require("../Games/games");
const Game = require("../Games/types/Mafia/Game");
const User = require("../Games/core/User");
const { TestSocket } = require("../lib/sockets");
const tutorialSetup = require("../Games/core/tutorial/setup");

let seq = 0;

// Same settings the tutorial host route sends.
function tutorialSettings(storyline) {
  return {
    setup: JSON.parse(JSON.stringify(tutorialSetup)),
    lobby: "Main",
    lobbyName: "Tutorial: Cop",
    private: true,
    guests: false,
    ranked: false,
    competitive: false,
    spectating: false,
    readyCheck: false,
    noVeg: true,
    stateLengths: { Day: 20 * 60 * 1000, Night: 20 * 60 * 1000 },
    gameTypeOptions: JSON.stringify({}),
    tutorial: { storyline },
  };
}

// What the game server's createGame handler does.
function createTutorial(storyline, prepare) {
  seq += 1;
  const id = `tutbots${seq}${Date.now()}`;
  const hostId = `tuthost${seq}${Date.now()}`;
  const game = new Game({
    id,
    hostId,
    port: 3010,
    settings: tutorialSettings(storyline || "cop"),
  });
  games[id] = game;
  if (prepare) prepare(game);
  return { game, id, hostId, init: game.init() };
}

function stop(game) {
  try {
    if (game.tutorial) game.tutorial.destroy();
    game.clearTimers();
  } catch (e) {}
}

describe("Tutorial bots", function () {
  this.timeout(30000);

  before(async function () {
    await db.promise;
  });

  it("seats all 8 bots before the game is handed to the player", async function () {
    for (const storyline of ["cop", "journalist", "lawyer", "janitor", "sheriff"]) {
      const { game, hostId, init } = createTutorial(storyline);
      await init;

      expect(game.players.filter((p) => p.isBot).length, storyline).to.equal(8);
      const seats = await redis.getGameInfo(game.id, true);
      expect(seats.players.length, storyline).to.equal(tutorialSetup.total);

      const socket = new TestSocket();
      const human = new User({ id: hostId, name: "Newbie", socket, settings: {} });
      await game.userJoin(human, false);
      const players = socket.clientMessages.filter((m) => m.eventName === "players").pop();
      expect(Object.keys(players.data).length, storyline).to.equal(9);
      stop(game);
    }
  });

  it("closes the game and fails the create when a bot does not join", async function () {
    const { game, id, hostId, init } = createTutorial("cop", (game) => {
      const userJoin = game.userJoin.bind(game);
      // One bot's join goes wrong (userJoin logs and swallows its errors).
      game.userJoin = async (user, options) => {
        if (user.tutorialBot && user.name === "Z") return;
        return userJoin(user, options);
      };
    });

    let error = null;
    try {
      await init;
    } catch (e) {
      error = e;
    }

    expect(error, "init should reject").to.be.an("error");
    expect(error.message).to.match(/7 of 8 tutorial bots/);
    expect(games[id]).to.equal(undefined);
    expect(await redis.gameExists(id)).to.not.be.ok;
    expect(await redis.inGame(hostId)).to.equal(false);
    for (const p of game.players) expect(await redis.inGame(p.user.id), p.name).to.equal(false);
  });

  it("closes the game when adding the bots throws", async function () {
    const { id, hostId, init } = createTutorial("sheriff", (game) => {
      const initTutorial = game.initTutorial.bind(game);
      game.initTutorial = async () => {
        await initTutorial();
        throw new Error("tutorial setup failed");
      };
    });

    let error = null;
    try {
      await init;
    } catch (e) {
      error = e;
    }

    expect(error && error.message).to.equal("tutorial setup failed");
    expect(games[id]).to.equal(undefined);
    expect(await redis.inGame(hostId)).to.equal(false);
  });

  it("leaves normal games alone when init has a problem", async function () {
    seq += 1;
    const game = new Game({
      id: `plain${seq}${Date.now()}`,
      hostId: `plainhost${seq}`,
      port: 3010,
      settings: { setup: { id: "setup", total: 3 }, private: true, stateLengths: { Day: 1000 } },
      isTest: true,
    });
    game.startHostingTimer = () => {
      throw new Error("boom");
    };
    await game.init(); // still resolves, as before
  });
});

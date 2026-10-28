const chai = require("chai"),
  expect = chai.expect;
const db = require("../db/db");
const redis = require("../modules/redis");
const models = require("../db/models");
const dmGate = require("../modules/dmGate");
const { SocketGroup, addSocket, removeSocket } = require("../modules/socketGroup");

function game(over = {}) {
  return {
    status: "In Progress",
    gameState: "Day",
    players: ["alice", "bob"],
    ...over,
    settings: { ranked: true, competitive: false, ...(over.settings || {}) },
  };
}

describe("DM gate", function () {
  describe("dmLockedByGame", function () {
    const lock = (g, userId = "alice", deadIds = []) =>
      dmGate.dmLockedByGame({ userId, game: g, deadIds });

    it("locks an alive player in a running ranked game", function () {
      expect(lock(game())).to.equal(true);
    });

    it("locks an alive player in a running competitive game", function () {
      expect(lock(game({ settings: { ranked: false, competitive: true } }))).to.equal(true);
    });

    it("allows unranked games", function () {
      expect(lock(game({ settings: { ranked: false } }))).to.equal(false);
    });

    it("allows waiting in a pregame lobby", function () {
      expect(lock(game({ status: "Open", gameState: "Pregame" }))).to.equal(false);
    });

    it("allows dead players", function () {
      expect(lock(game(), "alice", ["alice"])).to.equal(false);
      expect(lock(game(), "bob", ["alice"])).to.equal(true);
    });

    it("allows players who left (no longer seated)", function () {
      expect(lock(game({ players: ["bob"] }))).to.equal(false);
    });

    it("allows postgame", function () {
      expect(lock(game({ gameState: "Postgame" }))).to.equal(false);
    });

    it("allows when there is no game", function () {
      expect(lock(null)).to.equal(false);
    });
  });

  describe("getDmAccess and hasPrivateChat", function () {
    beforeEach(async function () {
      await db.promise;
      await redis.client.flushdbAsync();
      await models.Ban.deleteMany({ userId: { $in: ["alice", "carl"] } });
    });

    after(async function () {
      await models.Ban.deleteMany({ userId: { $in: ["alice", "carl"] } });
    });

    async function seat(settings) {
      await redis.createGame("g1", {
        type: "Mafia",
        port: 1,
        status: "In Progress",
        hostId: "alice",
        settings: { setup: "s", ranked: false, competitive: false, ...settings },
        createTime: Date.now(),
      });
      await redis.setGameState("g1", "Day");
      await redis.client.saddAsync("game:g1:players", "alice");
      await redis.client.setAsync("user:alice:game", "g1");
    }

    it("is unlocked when not in a game", async function () {
      expect(await dmGate.getDmAccess("alice")).to.deep.equal({ locked: false });
    });

    it("locks an alive ranked player and unlocks once dead", async function () {
      await seat({ ranked: true });
      const access = await dmGate.getDmAccess("alice");
      expect(access.locked).to.equal(true);
      expect(access.gameId).to.equal("g1");
      expect(access.message).to.equal(dmGate.DM_LOCKED_MESSAGE);

      await redis.setPlayerDead("g1", "alice", true);
      expect((await dmGate.getDmAccess("alice")).locked).to.equal(false);
      await redis.setPlayerDead("g1", "alice", false);
      expect((await dmGate.getDmAccess("alice")).locked).to.equal(true);
    });

    it("unlocks after leaving the game", async function () {
      await seat({ competitive: true });
      await redis.leaveGame("alice");
      expect((await dmGate.getDmAccess("alice")).locked).to.equal(false);
    });

    it("is unlocked in an unranked game", async function () {
      await seat({});
      expect((await dmGate.getDmAccess("alice")).locked).to.equal(false);
    });

    it("deleting the game clears the dead set", async function () {
      await seat({ ranked: true });
      await redis.setPlayerDead("g1", "alice", true);
      await redis.deleteGame("g1");
      expect(await redis.getDeadPlayers("g1")).to.deep.equal([]);
    });

    it("treats privateChat as granted when only a gameAuto ban removed it", async function () {
      await models.Ban.create({ id: "b1", userId: "alice", expires: 0, permissions: ["privateChat"], type: "gameAuto", auto: true });
      expect(await dmGate.hasPrivateChat("alice", { perms: {} })).to.equal(true);
    });

    it("keeps real privateChat bans", async function () {
      await models.Ban.create({ id: "b2", userId: "carl", expires: 0, permissions: ["privateChat"], type: "gameAuto", auto: true });
      await models.Ban.create({ id: "b3", userId: "carl", expires: Date.now() + 60000, permissions: ["privateChat"], type: "privateChat" });
      expect(await dmGate.hasPrivateChat("carl", { perms: {} })).to.equal(false);
    });

    it("refuses when no ban explains the missing perm", async function () {
      expect(await dmGate.hasPrivateChat("carl", { perms: {} })).to.equal(false);
      expect(await dmGate.hasPrivateChat("carl", { perms: { privateChat: true } })).to.equal(true);
    });
  });
});

describe("Chat SocketGroup", function () {
  function fake() {
    const sent = [];
    return { sent, send: (...a) => sent.push(a) };
  }

  it("fans out to every socket of a user and drops empty groups", function () {
    const map = {};
    const a = fake(), b = fake();
    addSocket(map, "u", a);
    addSocket(map, "u", b);
    map.u.send("newNotif", 1);
    expect(a.sent).to.deep.equal([["newNotif", 1]]);
    expect(b.sent).to.deep.equal([["newNotif", 1]]);

    map.u.sendExcept(a, "notifsRead", "c");
    expect(a.sent.length).to.equal(1);
    expect(b.sent[1]).to.deep.equal(["notifsRead", "c"]);

    removeSocket(map, "u", a);
    expect(map.u.size).to.equal(1);
    removeSocket(map, "u", b);
    expect(map.u).to.equal(undefined);
  });

  it("is a SocketGroup", function () {
    const map = {};
    addSocket(map, "u", fake());
    expect(map.u).to.be.instanceOf(SocketGroup);
  });
});

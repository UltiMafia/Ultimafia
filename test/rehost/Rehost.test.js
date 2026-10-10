require("dotenv").config();
const chai = require("chai");
const expect = chai.expect;
const db = require("../../db/db");
const models = require("../../db/models");
const redis = require("../../modules/redis");
const rehost = require("../../modules/rehost");
const Game = require("../../Games/core/Game");
const MafiaGame = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

function received(user, eventName) {
  return user.socket.clientMessages.filter((m) => m.eventName === eventName).map((m) => m.data);
}

describe("Rehost: carry lobby settings over", function () {
  describe("setupSummary", function () {
    it("keeps only what the client needs to draw the setup", function () {
      const summary = rehost.setupSummary({ id: "s", name: "N", gameType: "Mafia", roles: [{ "Villager:": 1 }], closed: false, count: { Village: 1 }, total: 1, creator: "x", hash: "y", _id: "z" });
      expect(summary).to.deep.equal({ id: "s", name: "N", gameType: "Mafia", roles: [{ "Villager:": 1 }], closed: false, unique: undefined, uniqueWithoutModifier: undefined, count: { Village: 1 }, total: 1, useRoleGroups: undefined, roleGroupSizes: undefined });
      expect(rehost.setupSummary(null)).to.equal(null);
    });
  });

  describe("buildRehostBody", function () {
    it("maps every stored lobby setting to the /host body", function () {
      const body = rehost.buildRehostBody({
        setupId: "setupA",
        lobby: "Sandbox",
        lobbyName: "Late night",
        private: true,
        guests: true,
        ranked: false,
        competitive: false,
        spectating: true,
        readyCheck: true,
        noVeg: true,
        stateLengths: { Day: 5 * 60000, Night: 90000 },
        anonymousGame: true,
        anonymousDeck: [{ id: "deckA", name: "A", profiles: [] }, { id: "deckB" }],
        gameTypeOptions: JSON.stringify({ extendLength: 2, pregameWaitLength: 3, advancedHosting: true }),
        scheduled: Date.now() + 1e6,
      });

      expect(body).to.deep.equal({
        extendLength: 2,
        pregameWaitLength: 3,
        advancedHosting: true,
        setup: "setupA",
        lobby: "Sandbox",
        lobbyName: "Late night",
        private: true,
        guests: true,
        ranked: false,
        competitive: false,
        spectating: true,
        readyCheck: true,
        noVeg: true,
        stateLengths: { Day: 5, Night: 1.5 },
        anonymousGame: true,
        anonymousDeckId: "deckA,deckB",
      });
      expect(body).not.to.have.property("scheduled");
      for (const field of rehost.CARRIED_FIELDS) expect(body).to.have.property(field);
    });

    it("turns anonymity off when the deck list is empty and accepts object options", function () {
      const body = rehost.buildRehostBody({
        setupId: "s",
        lobby: "Main",
        anonymousGame: true,
        anonymousDeck: [],
        gameTypeOptions: { wordLength: 5 },
      });
      expect(body.anonymousGame).to.equal(false);
      expect(body.anonymousDeckId).to.equal(undefined);
      expect(body.wordLength).to.equal(5);
      expect(body.readyCheck).to.equal(false);
    });
  });

  describe("getRehostSource", function () {
    let setup, host, other;

    before(async function () {
      await db.promise;
      await redis.client.flushdbAsync();
      await models.Game.deleteMany({ id: /^rehost-/ });
      await models.User.deleteMany({ id: /^rehost-/ });
      await models.Setup.deleteMany({ id: "rehost-setup" });
      setup = await models.Setup.create({ id: "rehost-setup", name: "R", gameType: "Mafia", total: 3 });
      host = await models.User.create({ id: "rehost-host", name: "RehostHost" });
      other = await models.User.create({ id: "rehost-other", name: "Stranger" });
      await models.Game.create({
        id: "rehost-old",
        type: "Mafia",
        lobby: "Main",
        lobbyName: "Host's lobby",
        setup: setup._id,
        users: [host._id, null],
        private: true,
        readyCheck: true,
        spectating: true,
        noVeg: false,
        stateLengths: { Day: 600000, Night: 120000 },
        gameTypeOptions: JSON.stringify({ extendLength: 3, pregameWaitLength: 2, advancedHosting: false }),
        anonymousGame: true,
        anonymousDeck: [{ id: "deckA", name: "Deck A" }],
      });
      // a "broken" duplicate record must never be used
      await models.Game.create({ id: "rehost-old", type: "Mafia", lobby: "Competitive", broken: true, setup: setup._id, users: [host._id] });
    });

    it("uses the finished game record for a participant", async function () {
      const src = await rehost.getRehostSource("rehost-old", "rehost-host");
      expect(src.gameType).to.equal("Mafia");
      expect(src.body).to.include({
        setup: "rehost-setup",
        lobby: "Main",
        lobbyName: "Host's lobby",
        private: true,
        readyCheck: true,
        spectating: true,
        anonymousGame: true,
        anonymousDeckId: "deckA",
        extendLength: 3,
        pregameWaitLength: 2,
      });
      expect(src.body.stateLengths).to.deep.equal({ Day: 10, Night: 2 });
    });

    it("ignores users who were not in the game", async function () {
      expect(await rehost.getRehostSource("rehost-old", "rehost-other")).to.equal(null);
      expect(await rehost.getRehostSource("rehost-missing", "rehost-host")).to.equal(null);
      expect(await rehost.getRehostSource("rehost-old", null)).to.equal(null);
    });

    it("prefers the live postgame lobby in redis (host may already have left)", async function () {
      const live = new MafiaGame({
        id: "rehost-live",
        hostId: "rehost-host",
        settings: {
          setup: { id: "rehost-setup", total: 3 },
          lobby: "Sandbox",
          lobbyName: "Live lobby",
          private: true,
          guests: true,
          spectating: false,
          readyCheck: true,
          noVeg: true,
          stateLengths: { Day: 180000, Night: 60000 },
          extendLength: 1,
          pregameWaitLength: 4,
          anonymousGame: true,
          anonymousDeck: [{ id: "deckB", name: "Deck B", profiles: [] }],
        },
        isTest: true,
      });
      await live.init();
      live.clearTimers();
      await redis.leaveGame("rehost-host");

      const src = await rehost.getRehostSource("rehost-live", "rehost-host");
      expect(src.gameType).to.equal("Mafia");
      expect(src.body).to.include({
        setup: "rehost-setup",
        lobby: "Sandbox",
        lobbyName: "Live lobby",
        private: true,
        guests: true,
        spectating: false,
        readyCheck: true,
        noVeg: true,
        anonymousGame: true,
        anonymousDeckId: "deckB",
        extendLength: 1,
        pregameWaitLength: 4,
      });
      expect(src.body.stateLengths).to.deep.equal({ Day: 3, Night: 1 });
      expect(await rehost.getRehostSource("rehost-live", "rehost-other")).to.equal(null);
    });
  });

  describe("Game.announceRehost", function () {
    async function finishedGameWith(names) {
      await db.promise;
      await redis.client.flushdbAsync();
      const game = new Game({
        id: "rehost-g1",
        hostId: names[0],
        settings: { setup: { id: "s", total: 5 }, spectating: true, stateLengths: { s1: 1000 } },
        isTest: true,
      });
      await game.init();
      const users = {};
      for (const n of names) {
        users[n] = new User({ id: n, socket: new Socket(), name: n, settings: {} });
        await game.userJoin(users[n]);
      }
      game.clearTimers();
      return { game, users };
    }

    it("invites everyone still in the postgame lobby except the rehoster", async function () {
      const { game, users } = await finishedGameWith(["host", "p1", "p2", "p3"]);
      game.players.array().find((p) => p.user.id === "p3").left = true;

      expect(game.announceRehost({ gameId: "newGame", hostId: "host", hostName: "Host" })).to.equal(false); // not finished yet
      game.finished = true;

      const setup = { id: "s1", name: "Some Setup", gameType: "Mafia", roles: [{ "Villager:": 2 }], total: 2 };
      expect(game.announceRehost({ gameId: "newGame", hostId: "host", hostName: "Host", setup })).to.equal(true);
      expect(received(users.p1, "rehosted")).to.deep.equal([{ gameId: "newGame", hostId: "host", hostName: "Host", setup }]);
      expect(received(users.p2, "rehosted")).to.have.lengthOf(1);
      expect(received(users.host, "rehosted")).to.have.lengthOf(0);
      expect(received(users.p3, "rehosted")).to.have.lengthOf(0); // already left
    });

    it("resends the invite when a participant's client reloads", async function () {
      const { game, users } = await finishedGameWith(["host", "p1"]);
      game.finished = true;
      game.announceRehost({ gameId: "newGame", hostId: "host", hostName: "Host" });

      const p1 = game.players.array().find((p) => p.user.id === "p1");
      const h = game.players.array().find((p) => p.user.id === "host");
      users.p1.socket.flushMessages();
      users.host.socket.flushMessages();
      game.sendAllGameInfo(p1);
      game.sendAllGameInfo(h);
      expect(received(users.p1, "rehosted")).to.have.lengthOf(1);
      expect(received(users.host, "rehosted")).to.have.lengthOf(0);
    });

    it("ignores a rehost pointing at itself or without an id", async function () {
      const { game } = await finishedGameWith(["host"]);
      game.finished = true;
      expect(game.announceRehost({ gameId: game.id })).to.equal(false);
      expect(game.announceRehost({})).to.equal(false);
    });

    it("sends lobbyName, readyCheck and noVeg in options so the client can rehost too", async function () {
      const game = new Game({
        id: "rehost-g2",
        hostId: "h",
        settings: { setup: { id: "s", total: 3 }, lobbyName: "LN", readyCheck: true, noVeg: true, stateLengths: {} },
        isTest: true,
      });
      expect(game.getOptionsPayload()).to.include({ lobbyName: "LN", readyCheck: true, noVeg: true });
    });
  });


  describe("POST /api/game/host with rehost", function () {
    const gameLoadBalancer = require("../../modules/gameLoadBalancer");
    const router = require("../../routes/game");
    let handler, created, notified, origCreate, origNotify, setup, host;

    function res() {
      return {
        statusCode: 200,
        body: null,
        status(c) { this.statusCode = c; return this; },
        send(b) { this.body = b; return this; },
        sendStatus(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
      };
    }

    before(async function () {
      await db.promise;
      await redis.client.flushdbAsync();
      handler = router.stack.find((l) => l.route && l.route.path === "/host" && l.route.methods.post).route.stack[0].handle;
      origCreate = gameLoadBalancer.createGame;
      origNotify = gameLoadBalancer.notifyRehost;
      gameLoadBalancer.createGame = async (hostId, gameType, settings) => {
        created.push({ hostId, gameType, settings });
        return "newGame" + created.length;
      };
      gameLoadBalancer.notifyRehost = async (...args) => {
        notified.push(args);
        return true;
      };

      await models.Game.deleteMany({ id: /^rehost-/ });
      await models.User.deleteMany({ id: /^rehost-/ });
      await models.Setup.deleteMany({ id: "rehost-setup" });
      await models.AnonymousDeck.deleteMany({ id: "rehost-deck" });
      setup = await models.Setup.create({ id: "rehost-setup", name: "R", gameType: "Mafia", total: 3, roles: JSON.stringify([{ "Villager:": 2, "Mafioso:": 1 }]) });
      host = await models.User.create({ id: "rehost-host", name: "RehostHost" });
      await models.User.create({ id: "rehost-other", name: "Stranger" });
      const profiles = await models.DeckProfile.insertMany([1, 2, 3].map((i) => ({ id: `rehost-prof${i}`, name: `Anon ${i}` })));
      await models.AnonymousDeck.create({ id: "rehost-deck", name: "Deck", profiles: profiles.map((p) => p._id), disabled: false });
      await models.Game.create({
        id: "rehost-old2",
        type: "Mafia",
        lobby: "Sandbox",
        lobbyName: "Password-ish private lobby",
        setup: setup._id,
        users: [host._id],
        private: true,
        guests: true,
        spectating: false,
        readyCheck: true,
        noVeg: true,
        stateLengths: { Day: 4 * 60000, Night: 2 * 60000 },
        gameTypeOptions: JSON.stringify({ extendLength: 4, pregameWaitLength: 2, advancedHosting: false }),
        anonymousGame: true,
        anonymousDeck: [{ id: "rehost-deck", name: "Deck" }],
      });
    });

    beforeEach(async function () {
      created = [];
      notified = [];
      await redis.client.delAsync("user:rehost-host:rateLimit:hostGame", "user:rehost-other:rateLimit:hostGame");
    });

    after(async function () {
      gameLoadBalancer.createGame = origCreate;
      gameLoadBalancer.notifyRehost = origNotify;
      await models.AnonymousDeck.deleteMany({ id: "rehost-deck" });
      await models.DeckProfile.deleteMany({ id: /^rehost-prof/ });
    });

    it("recreates the lobby with the old settings and invites the old lobby", async function () {
      // what an older client sends: only a few fields, and some of them stale
      const r = res();
      await handler({ body: { key: process.env.BOT_KEY, userId: "rehost-host", rehost: "rehost-old2", gameType: "Mafia", setup: "rehost-setup", lobby: "Main", private: false, readyCheck: false } }, r);

      expect(r.body).to.equal("newGame1");
      expect(created).to.have.lengthOf(1);
      const s = created[0].settings;
      expect(s).to.include({
        lobby: "Sandbox",
        lobbyName: "Password-ish private lobby",
        private: true,
        guests: true,
        spectating: false,
        readyCheck: true,
        noVeg: true,
        ranked: false,
        competitive: false,
        anonymousGame: true,
        anonymousDeckId: "rehost-deck",
        extendLength: 4,
        pregameWaitLength: 2,
        rehostId: "rehost-old2",
      });
      expect(s.stateLengths).to.include({ Day: 4 * 60000, Night: 2 * 60000 });
      expect(s.setup.id).to.equal("rehost-setup");
      expect(s.anonymousDeck.map((d) => d.id)).to.deep.equal(["rehost-deck"]);
      expect(s.scheduled).to.not.be.ok;
      await new Promise((r) => setImmediate(r));
      expect(notified).to.have.lengthOf(1);
      const [oldId, newId, info] = notified[0];
      expect([oldId, newId, info.hostId, info.hostName]).to.deep.equal(["rehost-old2", "newGame1", "rehost-host", "RehostHost"]);
      // the new game's setup, trimmed to what the client needs to draw it
      expect(info.setup).to.include({ id: "rehost-setup", name: "R", gameType: "Mafia", total: 3 });
      expect(info.setup.roles).to.deep.equal([{ "Villager:": 2, "Mafioso:": 1 }]);
      expect(info.setup).to.not.have.property("creator");
    });

    it("someone who wasn't in the game gets the old behaviour (body only, no invite)", async function () {
      const r = res();
      await handler({ body: { key: process.env.BOT_KEY, userId: "rehost-other", rehost: "rehost-old2", gameType: "Mafia", setup: "rehost-setup", lobby: "Main", spectating: true } }, r);
      expect(created).to.have.lengthOf(1);
      expect(created[0].settings).to.include({ lobby: "Main", private: false, readyCheck: false, anonymousGame: false, spectating: true });
      await new Promise((r) => setImmediate(r));
      expect(notified).to.have.lengthOf(0);
    });
  });

  after(async function () {
    await models.Game.deleteMany({ id: /^rehost-/ });
    await models.User.deleteMany({ id: /^rehost-/ });
    await models.Setup.deleteMany({ id: "rehost-setup" });
  });
});

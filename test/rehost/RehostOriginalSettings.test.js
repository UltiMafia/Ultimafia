require("dotenv").config();
const chai = require("chai");
const expect = chai.expect;
const shortid = require("shortid");
const db = require("../../db/db");
const models = require("../../db/models");
const redis = require("../../modules/redis");
const rehost = require("../../modules/rehost");
const lobbyName = require("../../modules/lobbyName");
const routeUtils = require("../../routes/utils");
const MafiaGame = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

// A rehost recreates the lobby the host made: ranked / competitive as the host
// set them (a leaver makes the game itself unranked), a custom lobby name kept,
// and a default "<host>'s lobby" name replaced by the rehoster's default.

describe("Rehost: original ranked/competitive and lobby names", function () {
  this.timeout(20000);

  describe("lobby name helpers", function () {
    it("treats blank, 'undefined' and the host's own default as not custom", function () {
      expect(lobbyName.isCustomLobbyName(null, "Alice")).to.equal(false);
      expect(lobbyName.isCustomLobbyName("", "Alice")).to.equal(false);
      expect(lobbyName.isCustomLobbyName("   ", "Alice")).to.equal(false);
      expect(lobbyName.isCustomLobbyName("undefined", "Alice")).to.equal(false);
      expect(lobbyName.isCustomLobbyName("Alice's lobby", "Alice")).to.equal(
        false,
      );
      expect(lobbyName.isCustomLobbyName("alice's LOBBY ", "Alice")).to.equal(
        false,
      );
    });

    it("keeps names that only look like a default", function () {
      expect(lobbyName.isCustomLobbyName("Bob's lobby", "Alice")).to.equal(
        true,
      );
      expect(
        lobbyName.isCustomLobbyName("Alice's lobby of doom", "Alice"),
      ).to.equal(true);
      expect(
        lobbyName.isCustomLobbyName("Late night 's Lobby", "Alice"),
      ).to.equal(true);
    });

    it("uses the stored flag, and for older games compares with the possible hosts' defaults", function () {
      const custom = lobbyName.rehostLobbyNameIsCustom;
      expect(
        custom({ lobbyName: "Alice's lobby", lobbyNameCustom: true }),
      ).to.equal(true);
      expect(
        custom({ lobbyName: "Night owls", lobbyNameCustom: false }),
      ).to.equal(false);
      expect(custom({ lobbyName: "", lobbyNameCustom: true })).to.equal(false);
      expect(
        custom({ lobbyName: "Alice's lobby", hostNames: ["Alice", "Bob"] }),
      ).to.equal(false);
      expect(
        custom({ lobbyName: "Carl's lobby", hostNames: ["Alice", "Bob"] }),
      ).to.equal(true);
      expect(
        custom({ lobbyName: "Alice's lobby party", hostNames: ["Alice"] }),
      ).to.equal(true);
    });
  });

  describe("buildRehostBody", function () {
    const base = { setupId: "s", lobby: "Main" };

    it("uses ranked/competitive as originally set, not as a leaver left them", function () {
      expect(
        rehost.buildRehostBody({ ...base, ranked: false, originalRanked: true })
          .ranked,
      ).to.equal(true);
      expect(
        rehost.buildRehostBody({
          ...base,
          competitive: false,
          originalCompetitive: true,
        }).competitive,
      ).to.equal(true);
    });

    it("keeps an unranked-from-the-start game unranked", function () {
      const body = rehost.buildRehostBody({
        ...base,
        ranked: false,
        originalRanked: false,
        competitive: false,
        originalCompetitive: false,
      });
      expect(body).to.include({ ranked: false, competitive: false });
    });

    it("falls back to ranked/competitive for games saved before the original was kept", function () {
      expect(rehost.buildRehostBody({ ...base, ranked: true }).ranked).to.equal(
        true,
      );
      expect(
        rehost.buildRehostBody({ ...base, ranked: false }).ranked,
      ).to.equal(false);
    });

    it("keeps a custom name and drops a default one", function () {
      expect(
        rehost.buildRehostBody({
          ...base,
          lobbyName: "Night owls",
          lobbyNameCustom: true,
        }).lobbyName,
      ).to.equal("Night owls");
      expect(
        rehost.buildRehostBody({
          ...base,
          lobbyName: "Alice's lobby",
          lobbyNameCustom: false,
        }).lobbyName,
      ).to.equal(undefined);
    });
  });

  describe("a ranked game someone leaves", function () {
    const games = [];
    before(async function () {
      await db.promise;
      await redis.client.flushdbAsync();
    });
    after(async function () {
      for (const g of games) {
        try {
          g.clearTimers();
          await g.cancel();
        } catch (e) {}
      }
      await redis.client.flushdbAsync();
    });

    async function startedGame(settings) {
      const users = [0, 1, 2, 3, 4].map(
        () =>
          new User({
            id: shortid.generate(),
            socket: new Socket(),
            name: shortid.generate(),
            settings: {},
            isTest: true,
          }),
      );
      const game = new MafiaGame({
        id: shortid.generate(),
        hostId: users[0].id,
        settings: {
          setup: {
            id: "rehost-orig-setup",
            total: 5,
            roles: [{ Villager: 4, Mafioso: 1 }],
          },
          lobby: "Main",
          stateLengths: { Day: 600000, Night: 600000 },
          pregameCountdownLength: 0,
          ...settings,
        },
        isTest: true,
      });
      await game.init();
      games.push(game);
      for (const u of users) await game.userJoin(u);
      // the start runs after the last join
      for (let i = 0; i < 100 && !game.started; i++)
        await new Promise((r) => setTimeout(r, 50));
      return { game, users };
    }

    it("goes unranked, but its rehost is ranked", async function () {
      const { game, users } = await startedGame({
        ranked: true,
        lobbyName: "Ranked night",
        lobbyNameCustom: true,
      });
      expect(
        game.started,
        `started=${game.started} starting=${game.starting} readyCheck=${game.isReadyCheckActive}`,
      ).to.equal(true);
      const leaver = game.players
        .array()
        .find((p) => p.user.id === users[3].id);
      await game.playerLeave(leaver);

      expect(game.ranked).to.equal(false); // the game itself is unranked now
      expect(game.originalRanked).to.equal(true);
      expect(game.getOptionsPayload()).to.include({
        ranked: false,
        originalRanked: true,
        lobbyNameCustom: true,
      });

      const src = await rehost.getRehostSource(game.id, users[1].id);
      expect(src.body).to.include({
        ranked: true,
        competitive: false,
        lobbyName: "Ranked night",
      });
    });

    it("an unranked-from-the-start game stays unranked", async function () {
      const { game, users } = await startedGame({
        ranked: false,
        lobbyName: "x's lobby",
        lobbyNameCustom: false,
      });
      expect(game.started).to.equal(true);
      await game.playerLeave(
        game.players.array().find((p) => p.user.id === users[2].id),
      );
      const src = await rehost.getRehostSource(game.id, users[1].id);
      expect(src.body.ranked).to.equal(false);
      expect(src.body.lobbyName).to.equal(undefined);
    });
  });

  describe("POST /api/game/host", function () {
    const gameLoadBalancer = require("../../modules/gameLoadBalancer");
    const router = require("../../routes/game");
    let handler, created, origCreate, origNotify, origVerify, setup, users;

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
          return this;
        },
        sendStatus(c) {
          this.statusCode = c;
          return this;
        },
        json(b) {
          this.body = b;
          return this;
        },
      };
    }

    async function post(body) {
      const r = res();
      await handler(
        {
          body: {
            key: process.env.BOT_KEY,
            gameType: "Mafia",
            setup: "rehost-orig-setup",
            lobby: "Main",
            ...body,
          },
        },
        r,
      );
      return r;
    }

    async function oldGame(id, fields) {
      await models.Game.deleteMany({ id });
      await redis.client.delAsync(`rehost:${id}`);
      await models.Game.create({
        id,
        type: "Mafia",
        lobby: "Main",
        setup: setup._id,
        users: [users.alice._id, users.bob._id, users.carl._id],
        stateLengths: { Day: 600000, Night: 120000 },
        gameTypeOptions: JSON.stringify({
          extendLength: 3,
          pregameWaitLength: 1,
          advancedHosting: false,
        }),
        ...fields,
      });
    }

    before(async function () {
      await db.promise;
      await redis.client.flushdbAsync();
      handler = router.stack.find(
        (l) => l.route && l.route.path === "/host" && l.route.methods.post,
      ).route.stack[0].handle;
      origCreate = gameLoadBalancer.createGame;
      origNotify = gameLoadBalancer.notifyRehost;
      origVerify = routeUtils.verifyPermission;
      gameLoadBalancer.createGame = async (hostId, gameType, settings) => {
        created.push({ hostId, gameType, settings });
        return "rehostOrigNew" + created.length;
      };
      gameLoadBalancer.notifyRehost = async () => true;
      // playGame / playRanked for these users
      routeUtils.verifyPermission = async () => true;

      await models.Game.deleteMany({ id: /^rehost-orig-/ });
      await models.User.deleteMany({ id: /^rehost-orig-/ });
      await models.Setup.deleteMany({ id: "rehost-orig-setup" });
      setup = await models.Setup.create({
        id: "rehost-orig-setup",
        name: "R",
        gameType: "Mafia",
        total: 3,
        ranked: true,
        roles: JSON.stringify([{ "Villager:": 2, "Mafioso:": 1 }]),
      });
      users = {};
      for (const [key, name] of [
        ["alice", "Alice"],
        ["bob", "Bob"],
        ["carl", "Carl"],
      ])
        users[key] = await models.User.create({
          id: `rehost-orig-${key}`,
          name,
          redHearts: 5,
          goldHearts: 5,
        });
    });

    beforeEach(async function () {
      created = [];
      for (const k of ["alice", "bob", "carl"]) {
        await redis.client.delAsync(
          `user:rehost-orig-${k}:rateLimit:hostGame`,
          `user:rehost-orig-${k}:game`,
          `user:rehost-orig-${k}:creatingGame`,
        );
      }
    });

    after(async function () {
      gameLoadBalancer.createGame = origCreate;
      gameLoadBalancer.notifyRehost = origNotify;
      routeUtils.verifyPermission = origVerify;
      await models.Game.deleteMany({ id: /^rehost-orig-/ });
      await models.User.deleteMany({ id: /^rehost-orig-/ });
      await models.Setup.deleteMany({ id: "rehost-orig-setup" });
    });

    it("a blank name gets the host's default and is marked not custom", async function () {
      const r = await post({ userId: "rehost-orig-alice", lobbyName: "  " });
      expect(r.statusCode, JSON.stringify(r.body)).to.equal(200);
      expect(created[0].settings).to.include({
        lobbyName: "Alice's lobby",
        lobbyNameCustom: false,
      });
    });

    it("a typed name is custom, even with 's lobby in it", async function () {
      await post({ userId: "rehost-orig-alice", lobbyName: "Carl's Lobby" });
      expect(created[0].settings).to.include({
        lobbyName: "Carl's Lobby",
        lobbyNameCustom: true,
      });
    });

    it("rehosting a ranked game that went unranked makes a ranked lobby", async function () {
      // A leaver made it unranked; the client sends the downgraded options.
      await oldGame("rehost-orig-ranked", {
        lobbyName: "Alice's lobby",
        lobbyNameCustom: false,
        ranked: false,
        originalRanked: true,
        competitive: false,
        originalCompetitive: false,
      });
      const r = await post({
        userId: "rehost-orig-bob",
        rehost: "rehost-orig-ranked",
        ranked: false,
        lobbyName: "Alice's lobby",
      });
      expect(r.statusCode, JSON.stringify(r.body)).to.equal(200);
      expect(created).to.have.lengthOf(1);
      expect(created[0].hostId).to.equal("rehost-orig-bob");
      expect(created[0].settings).to.include({
        ranked: true,
        competitive: false,
        rehostId: "rehost-orig-ranked",
        // default name -> the rehoster's default
        lobbyName: "Bob's lobby",
        lobbyNameCustom: false,
      });
    });

    it("a custom lobby name is kept by the rehost", async function () {
      await oldGame("rehost-orig-custom", {
        lobbyName: "Friday Ranked",
        lobbyNameCustom: true,
        ranked: false,
        originalRanked: true,
      });
      await post({ userId: "rehost-orig-carl", rehost: "rehost-orig-custom" });
      expect(created[0].settings).to.include({
        ranked: true,
        lobbyName: "Friday Ranked",
        lobbyNameCustom: true,
      });
    });

    it("an unranked-from-the-start game is rehosted unranked", async function () {
      await oldGame("rehost-orig-unranked", {
        lobbyName: "Chill",
        lobbyNameCustom: true,
        ranked: false,
        originalRanked: false,
      });
      await post({
        userId: "rehost-orig-alice",
        rehost: "rehost-orig-unranked",
        ranked: true,
      });
      expect(created[0].settings).to.include({
        ranked: false,
        lobbyName: "Chill",
      });
    });

    it("an older record without flags: default name detected from the players' names", async function () {
      await oldGame("rehost-orig-legacy", {
        lobbyName: "Alice's lobby",
        ranked: true,
      });
      await post({ userId: "rehost-orig-carl", rehost: "rehost-orig-legacy" });
      expect(created[0].settings).to.include({
        ranked: true,
        lobbyName: "Carl's lobby",
        lobbyNameCustom: false,
      });

      await oldGame("rehost-orig-legacy2", {
        lobbyName: "Alice's lobby of legends",
      });
      await post({ userId: "rehost-orig-bob", rehost: "rehost-orig-legacy2" });
      expect(created[1].settings).to.include({
        lobbyName: "Alice's lobby of legends",
        lobbyNameCustom: true,
      });
    });
  });
});

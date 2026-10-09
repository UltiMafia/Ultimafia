const bluebird = require("bluebird");
const mockRedisClient = {
  on() {},
  select() {},
  duplicate() {
    return this;
  },
  subscribe() {},
  existsAsync: async () => false,
  set() {},
  getAsync: async () => null,
  smembersAsync: async () => [],
};
const mockRedis = {
  createClient: () => mockRedisClient,
};
bluebird.promisifyAll(mockRedis);

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
  if (name === "redis") return mockRedis;
  return originalRequire.apply(this, arguments);
};

const chai = require("chai");
const should = chai.should();
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("../routes/utils");
const redis = require("../modules/redis");
const gameLoadBalancer = require("../modules/gameLoadBalancer");
const skillRating = require("../modules/skillRating");
const Game = require("../Games/core/Game");
const gameRouter = require("../routes/game");

const ownerOid = "507f1f77bcf86cd799439011";
const setupOid = "507f1f77bcf86cd799439013";

function queryChain(value) {
  const query = {
    select() {
      return query;
    },
    populate() {
      return query;
    },
    lean() {
      return query;
    },
    exec: async () => value,
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
  return query;
}

function makeMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    setHeader() {},
  };
}

function handlerFor(router, method, path) {
  const layer = router.stack.find(
    (entry) =>
      entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) return null;
  return layer.route.stack[0].handle;
}

function hostSetup(extra) {
  const doc = Object.assign(
    {
      _id: setupOid,
      id: "setup1",
      name: "Hidden",
      gameType: "Mafia",
      roles: "[]",
      total: 7,
      ranked: false,
      competitive: false,
      archived: true,
      creator: { id: "creator1" },
    },
    extra
  );
  doc.toJSON = function () {
    const copy = Object.assign({}, this);
    delete copy.toJSON;
    return copy;
  };
  return doc;
}

describe("setup archive host and last played", function () {
  const hostHandler = handlerFor(gameRouter, "post", "/host");
  const originals = {};

  before(function () {
    originals.userFind = models.User.findOne;
    originals.setupFindOne = models.Setup.findOne;
    originals.setupUpdate = models.Setup.updateOne;
    originals.game = models.Game;
    originals.leave = models.LeavePenalty.findOne;
    originals.verify = routeUtils.verifyLoggedIn;
    originals.perm = routeUtils.verifyPermission;
    originals.rate = routeUtils.rateLimit;
    originals.userInfo = redis.getUserInfo;
    originals.creating = redis.getSetCreatingGame;
    originals.inGame = redis.inGame;
    originals.unset = redis.unsetCreatingGame;
    originals.createGame = gameLoadBalancer.createGame;
    originals.ratings = skillRating.updateGameRatings;
  });

  afterEach(function () {
    models.User.findOne = originals.userFind;
    models.Setup.findOne = originals.setupFindOne;
    models.Setup.updateOne = originals.setupUpdate;
    models.Game = originals.game;
    models.LeavePenalty.findOne = originals.leave;
    routeUtils.verifyLoggedIn = originals.verify;
    routeUtils.verifyPermission = originals.perm;
    routeUtils.rateLimit = originals.rate;
    redis.getUserInfo = originals.userInfo;
    redis.getSetCreatingGame = originals.creating;
    redis.inGame = originals.inGame;
    redis.unsetCreatingGame = originals.unset;
    gameLoadBalancer.createGame = originals.createGame;
    skillRating.updateGameRatings = originals.ratings;
  });

  function stubPerm(admin) {
    routeUtils.verifyPermission = async (...args) => {
      const firstIsUser = typeof args[0] === "string" || args[0] == null;
      const perm = firstIsUser ? args[1] : args[2];
      const rank = firstIsUser ? args[2] : args[3];
      if (perm === "playGame") return true;
      if (perm === "manageArchivedSetups") return admin;
      if (rank != null) return admin;
      return false;
    };
  }

  function stubHostDeps() {
    const updates = [];
    let hosted = null;
    models.Setup.updateOne = (query, update) => {
      updates.push({ query, update });
      return queryChain({});
    };
    models.LeavePenalty.findOne = () => queryChain(null);
    routeUtils.rateLimit = async () => true;
    redis.getUserInfo = async () => ({ name: "Host", redHearts: 3 });
    redis.getSetCreatingGame = async () => false;
    redis.inGame = async () => null;
    redis.unsetCreatingGame = () => {};
    gameLoadBalancer.createGame = async (userId, gameType, settings) => {
      hosted = settings;
      return "game-1";
    };
    return {
      updates,
      hosted() {
        return hosted;
      },
    };
  }

  function hostReq() {
    return {
      body: {
        gameType: "Mafia",
        lobby: "Main",
        setup: "setup1",
        extendLength: 2,
        pregameWaitLength: 2,
        private: true,
        stateLengths: {},
      },
      session: {},
      get() {},
    };
  }

  it("finds the host handler", function () {
    should.exist(hostHandler);
  });

  it("does not unarchive an archived setup for a stranger", async function () {
    const deps = stubHostDeps();
    routeUtils.verifyLoggedIn = async () => "stranger";
    stubPerm(false);
    models.Setup.findOne = () => queryChain(hostSetup());

    const res = makeMockRes();
    await hostHandler(hostReq(), res);

    res.statusCode.should.equal(404);
    res.body.should.equal("Setup not found");
    deps.updates.should.have.lengthOf(0);
    should.equal(deps.hosted(), null);
  });

  it("unarchives and hosts for the creator", async function () {
    const deps = stubHostDeps();
    routeUtils.verifyLoggedIn = async () => "creator1";
    stubPerm(false);
    models.Setup.findOne = () => queryChain(hostSetup());

    const res = makeMockRes();
    await hostHandler(hostReq(), res);

    res.body.should.equal("game-1");
    deps.updates.should.have.lengthOf(1);
    deps.updates[0].query.should.deep.equal({ id: "setup1" });
    deps.updates[0].update.$set.archived.should.equal(false);
    deps.updates[0].update.$unset.should.have.property("archivedAt");
    const hostedSetup = deps.hosted().setup;
    hostedSetup.should.not.have.property("creator");
    hostedSetup.should.not.have.property("archived");
    hostedSetup.should.not.have.property("_id");
    hostedSetup.roles.should.deep.equal([]);
  });

  it("unarchives a bot-owned setup for an admin only", async function () {
    models.User.findOne = (query) => {
      if (String(query._id) === ownerOid) {
        return queryChain({ id: constants.SETUP_ARCHIVIST_BOT_ID });
      }
      return queryChain(null);
    };
    models.Setup.findOne = () =>
      queryChain(hostSetup({ creator: ownerOid }));

    const denied = stubHostDeps();
    routeUtils.verifyLoggedIn = async () => "creator1";
    stubPerm(false);
    const hidden = makeMockRes();
    await hostHandler(hostReq(), hidden);
    hidden.statusCode.should.equal(404);
    denied.updates.should.have.lengthOf(0);

    const allowed = stubHostDeps();
    routeUtils.verifyLoggedIn = async () => "admin1";
    stubPerm(true);
    const shown = makeMockRes();
    await hostHandler(hostReq(), shown);
    shown.body.should.equal("game-1");
    allowed.updates.should.have.lengthOf(1);
    allowed.updates[0].update.$set.archived.should.equal(false);
  });

  it("hosts a public setup without unarchiving it", async function () {
    const deps = stubHostDeps();
    routeUtils.verifyLoggedIn = async () => "stranger";
    stubPerm(false);
    models.Setup.findOne = () => queryChain(hostSetup({ archived: false }));

    const res = makeMockRes();
    await hostHandler(hostReq(), res);

    res.body.should.equal("game-1");
    deps.updates.should.have.lengthOf(0);
  });

  it("sets lastPlayedAt when a game ends, including a veg game", async function () {
    let captured;
    models.Setup.findOne = () =>
      queryChain({
        _id: setupOid,
        id: "setup1",
        version: 1,
        played: 2,
      });
    models.Setup.updateOne = (query, update) => {
      captured = { query, update };
      return queryChain({});
    };
    models.Game = function () {
      return { save: async () => ({ _id: "gameDoc" }) };
    };
    skillRating.updateGameRatings = async () => {};

    const fake = {
      _postgamePersisted: false,
      postgame: null,
      isKudosEligible() {
        return false;
      },
      setup: { id: "setup1", version: 1 },
      recordSetupStats: async () => {},
      history: {
        getHistoryInfo() {
          return {};
        },
      },
      playersGone: {},
      players: [],
      originalRoles: {},
      spectatorsOld: [],
      winners: {
        players: [],
        getWinnersInfo() {
          return {};
        },
      },
      id: "g1",
      type: "Mafia",
      lobby: "Main",
      lobbyName: "Host's lobby",
      startTime: 1,
      ranked: false,
      competitive: false,
      private: true,
      guests: false,
      spectating: false,
      readyCheck: false,
      noVeg: false,
      hadVegKill: true,
      stateLengths: {},
      getGameTypeOptions() {
        return {};
      },
      anonymousGame: false,
      anonymousDeck: null,
      finalizePostgameCleanup: async () => {},
    };

    await Game.prototype._doEndPostgame.call(fake);
    String(captured.query._id).should.equal(setupOid);
    captured.update.$set.lastPlayedAt.should.be.a("number");
  });
});

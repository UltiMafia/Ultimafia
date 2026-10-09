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
  delAsync: async () => 1,
  zrangebyscoreAsync: async () => [],
};
const mockRedis = {
  createClient: () => mockRedisClient,
};
bluebird.promisifyAll(mockRedis);

const mockFirebase = {
  initializeApp() {},
  credential: { cert() { return {}; } },
  auth() {
    return { verifyIdToken: async () => ({}), getUserByEmail: async () => null };
  },
};

process.env.EMAIL_DOMAINS = process.env.EMAIL_DOMAINS || '["gmail.com"]';
process.env.FIREBASE_JSON_FILE =
  process.env.FIREBASE_JSON_FILE || "firebase.json";
process.env.BASE_URL = process.env.BASE_URL || "http://localhost";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
  if (name === "redis") return mockRedis;
  if (name === "firebase-admin") return mockFirebase;
  if (name.endsWith("firebase.json")) return { project_id: "test" };
  return originalRequire.apply(this, arguments);
};

const chai = require("chai");
const should = chai.should();
const constants = require("../../data/constants");
const models = require("../../db/models");
const routeUtils = require("../../routes/utils");
const redis = require("../../modules/redis");
const gameLoadBalancer = require("../../modules/gameLoadBalancer");
const setupRouter = require("../../routes/setup");
const modRouter = require("../../routes/mod");
const gameRouter = require("../../routes/game");
const userRouter = require("../../routes/user");

const botOid = "507f1f77bcf86cd799439012";
const creatorOid = "507f1f77bcf86cd799439011";
const setupOid = "507f1f77bcf86cd799439013";
const actorOid = "507f1f77bcf86cd799439014";

const ACTORS = {
  admin: "admin1",
  liaison: "liaison1",
  mod: "mod1",
  regular: "regular1",
  original: "original1",
};

const RANKS = {
  admin: 10,
  liaison: 9,
  mod: 5,
  regular: 0,
  original: 0,
};

const PERMS = {
  admin: new Set([
    "manageArchivedSetups",
    "restoreSetup",
    "editAnySetup",
    "deleteSetup",
    "featureSetup",
    "approveRanked",
    "approveCompetitive",
    "archiveSetup",
    "clearSetupName",
    "playGame",
  ]),
  liaison: new Set([
    "editAnySetup",
    "featureSetup",
    "approveRanked",
    "approveCompetitive",
    "playGame",
  ]),
  mod: new Set([
    "deleteSetup",
    "clearSetupName",
    "featureSetup",
    "approveRanked",
    "approveCompetitive",
    "playGame",
  ]),
  regular: new Set(["playGame"]),
  original: new Set(["playGame"]),
};

const PATHS = [
  "edit",
  "delete",
  "description",
  "feature",
  "ranked",
  "competitive",
  "archive",
  "clearName",
  "clearDescription",
  "host",
];

function chain(value) {
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
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      this.body = code;
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

function decide(path, role, kind) {
  const perms = PERMS[role];
  if (kind === "bot") {
    return perms.has("manageArchivedSetups") ? "allow" : "deny";
  }

  const isCreator = role === "regular";
  switch (path) {
    case "edit":
      return isCreator || perms.has("editAnySetup") ? "allow" : "deny";
    case "description":
      return isCreator ? "allow" : "deny";
    case "delete":
      return isCreator || perms.has("deleteSetup") ? "allow" : "deny";
    case "feature":
      return perms.has("featureSetup") ? "allow" : "deny";
    case "ranked":
      return perms.has("approveRanked") ? "allow" : "deny";
    case "competitive":
      return perms.has("approveCompetitive") ? "allow" : "deny";
    case "archive":
      return perms.has("archiveSetup") ? "allow" : "deny";
    case "clearName":
    case "clearDescription":
      return perms.has("clearSetupName") ? "allow" : "deny";
    case "host":
      return isCreator || role === "admin" ? "allow" : "deny";
    default:
      return "deny";
  }
}

function setupRecord(kind, path) {
  const bot = kind === "bot";
  const doc = {
    _id: setupOid,
    id: "setup1",
    name: "Perm Setup",
    gameType: "Mafia",
    roles: "[]",
    total: 5,
    version: 1,
    ranked: false,
    competitive: false,
    featured: false,
    archived: path === "host",
    creator: bot
      ? {
          _id: botOid,
          id: constants.SETUP_ARCHIVIST_BOT_ID,
          deleted: false,
        }
      : {
          _id: creatorOid,
          id: "regular1",
          deleted: path === "archive",
        },
  };
  doc.toJSON = function () {
    const copy = Object.assign({}, this);
    delete copy.toJSON;
    return copy;
  };
  return doc;
}

function editorDoc(actorId, full) {
  const setups = full ? new Array(constants.maxOwnedSetups).fill("x") : [];
  return {
    _id: actorOid,
    id: actorId,
    setups,
    toJSON() {
      return { _id: actorOid, id: actorId, setups };
    },
  };
}

describe("SetupArchivistBot permissions", function () {
  const handlers = {
    edit: handlerFor(setupRouter, "post", "/create"),
    delete: handlerFor(setupRouter, "post", "/delete"),
    description: handlerFor(setupRouter, "post", "/description"),
    feature: handlerFor(setupRouter, "post", "/feature"),
    ranked: handlerFor(setupRouter, "post", "/ranked"),
    competitive: handlerFor(setupRouter, "post", "/competitive"),
    archive: handlerFor(setupRouter, "post", "/archive"),
    clearName: handlerFor(modRouter, "post", "/clearSetupName"),
    clearDescription: handlerFor(modRouter, "post", "/clearSetupDescription"),
    host: handlerFor(gameRouter, "post", "/host"),
    search: handlerFor(userRouter, "get", "/searchName"),
  };
  const originals = {};

  before(function () {
    originals.userFind = models.User.findOne;
    originals.userFindMany = models.User.find;
    originals.userAggregate = models.User.aggregate;
    originals.userUpdate = models.User.updateOne;
    originals.setupFind = models.Setup.findOne;
    originals.setupUpdate = models.Setup.updateOne;
    originals.setupUpdateMany = models.Setup.updateMany;
    originals.version = models.SetupVersion;
    originals.leave = models.LeavePenalty.findOne;
    originals.verify = routeUtils.verifyLoggedIn;
    originals.perm = routeUtils.verifyPermission;
    originals.rate = routeUtils.rateLimit;
    originals.modAction = routeUtils.createModAction;
    originals.userInfo = redis.getUserInfo;
    originals.creating = redis.getSetCreatingGame;
    originals.inGame = redis.inGame;
    originals.unset = redis.unsetCreatingGame;
    originals.status = redis.getUserStatus;
    originals.createGame = gameLoadBalancer.createGame;
  });

  afterEach(function () {
    models.User.findOne = originals.userFind;
    models.User.find = originals.userFindMany;
    models.User.aggregate = originals.userAggregate;
    models.User.updateOne = originals.userUpdate;
    models.Setup.findOne = originals.setupFind;
    models.Setup.updateOne = originals.setupUpdate;
    models.Setup.updateMany = originals.setupUpdateMany;
    models.SetupVersion = originals.version;
    models.LeavePenalty.findOne = originals.leave;
    routeUtils.verifyLoggedIn = originals.verify;
    routeUtils.verifyPermission = originals.perm;
    routeUtils.rateLimit = originals.rate;
    routeUtils.createModAction = originals.modAction;
    redis.getUserInfo = originals.userInfo;
    redis.getSetCreatingGame = originals.creating;
    redis.inGame = originals.inGame;
    redis.unsetCreatingGame = originals.unset;
    redis.getUserStatus = originals.status;
    gameLoadBalancer.createGame = originals.createGame;
  });

  function install(role, kind, path, opts) {
    const actorId = ACTORS[role];
    const updates = [];
    const perms = PERMS[role];
    const rank = RANKS[role];

    routeUtils.verifyLoggedIn = async () => actorId;
    routeUtils.rateLimit = async () => true;
    routeUtils.createModAction = async () => {};
    routeUtils.verifyPermission = async (...args) => {
      if (opts && opts.permOverride) return opts.permOverride(...args);
      const firstIsUser = typeof args[0] === "string" || args[0] == null;
      const perm = firstIsUser ? args[1] : args[2];
      const needRank = firstIsUser ? args[2] : args[3];
      if (needRank != null && rank < needRank) return false;
      if (perm == null) return true;
      return perms.has(perm);
    };

    models.User.findOne = (query) => {
      if (query && query.id === constants.SETUP_ARCHIVIST_BOT_ID) {
        return chain({ _id: botOid, id: constants.SETUP_ARCHIVIST_BOT_ID });
      }
      if (query && query.id === actorId) {
        return chain(editorDoc(actorId, opts && opts.full));
      }
      return chain(null);
    };
    models.User.updateOne = () => chain({});
    models.Setup.findOne = () => chain(setupRecord(kind, path));
    models.Setup.updateOne = (query, update) => {
      updates.push({ query, update });
      return chain({});
    };
    models.Setup.updateMany = (query, update) => {
      updates.push({ query, update, many: true });
      return chain({});
    };

    function Version() {}
    Version.findOne = () => chain(null);
    Version.prototype.save = async function () {};
    models.SetupVersion = Version;

    models.LeavePenalty.findOne = () => chain(null);
    redis.getUserInfo = async () => ({ name: "Host", redHearts: 3 });
    redis.getSetCreatingGame = async () => false;
    redis.inGame = async () => null;
    redis.unsetCreatingGame = () => {};
    redis.getUserStatus = async () => "offline";
    gameLoadBalancer.createGame = async () => "game-1";

    return updates;
  }

  function requestFor(path) {
    if (path === "edit") {
      return {
        body: {
          editing: true,
          id: "setup1",
          gameType: "Mafia",
          name: "Perm Setup",
          closed: false,
          roles: [{ "Villager:": 3, "Mafioso:": 2 }],
          count: {},
          useRoleGroups: false,
          roleGroupSizes: [1],
          startState: "Night",
          creator: "hacker",
          originalCreator: "hacker",
          archived: false,
          ownershipHistory: [{ from: "hacker" }],
        },
        session: { user: { _id: actorOid } },
        get() {},
      };
    }
    if (path === "description") {
      return { body: { id: "setup1", description: "notes" }, session: {} };
    }
    if (path === "delete" || path === "archive") {
      return { body: { id: "setup1" }, session: {} };
    }
    if (path === "host") {
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
    return { body: { setupId: "setup1" }, session: {} };
  }

  async function runCase(path, role, kind, opts) {
    const updates = install(role, kind, path, opts);
    const res = makeMockRes();
    await handlers[path](requestFor(path), res);
    return { res, updates };
  }

  it("grants manageArchivedSetups and restoreSetup to Admin only", function () {
    constants.allPerms.manageArchivedSetups.should.equal(true);
    constants.allPerms.restoreSetup.should.equal(true);
    constants.defaultGroups.Owner.perms.should.equal("*");
    constants.defaultGroups.Admin.perms.should.include("manageArchivedSetups");
    constants.defaultGroups.Admin.perms.should.include("restoreSetup");
    constants.defaultGroups.Liaison.perms.should.not.include(
      "manageArchivedSetups"
    );
    constants.defaultGroups.Liaison.perms.should.not.include("restoreSetup");
    constants.defaultGroups.Mod.perms.should.not.include("manageArchivedSetups");
    constants.defaultGroups.Mod.perms.should.not.include("restoreSetup");
    should.exist(handlers.edit);
    should.exist(handlers.host);
    should.exist(handlers.clearName);
  });

  for (const path of PATHS) {
    for (const role of Object.keys(ACTORS)) {
      for (const kind of ["bot", "normal"]) {
        const decision = decide(path, role, kind);
        it(`${role} ${decision === "allow" ? "allows" : "denies"} ${path} on a ${kind} setup`, async function () {
          const { res, updates } = await runCase(path, role, kind);
          if (decision === "deny") {
            res.statusCode.should.equal(path === "host" ? 404 : 403);
            updates.should.have.lengthOf(0);
            return;
          }

          const code = res.statusCode || 200;
          if (code >= 400) {
            throw new Error(
              `${role} ${path} ${kind} returned ${code} ${JSON.stringify(res.body)}`
            );
          }
          updates.length.should.be.above(0);
          if (path === "host") res.body.should.equal("game-1");
          if (path === "edit") {
            res.body.should.equal("setup1");
            const written = updates.find(
              (entry) => entry.update.$set && entry.update.$set.name
            );
            should.exist(written);
            written.update.$set.should.not.have.property("creator");
            written.update.$set.should.not.have.property("originalCreator");
            written.update.$set.should.not.have.property("ownershipHistory");
            written.update.$set.should.not.have.property("archived");
          }
        });
      }
    }
  }

  it("does not count a bot-owned edit against maxOwnedSetups", async function () {
    const { res, updates } = await runCase("edit", "admin", "bot", {
      full: true,
    });
    const code = res.statusCode || 200;
    if (code >= 400) {
      throw new Error(`bot edit at cap returned ${code} ${JSON.stringify(res.body)}`);
    }
    res.body.should.equal("setup1");
    updates.length.should.be.above(0);
  });

  it("still counts a normal edit against maxOwnedSetups", async function () {
    const { res, updates } = await runCase("edit", "admin", "normal", {
      full: true,
    });
    res.statusCode.should.equal(409);
    updates.should.have.lengthOf(0);
  });

  it("does not unarchive a bot-owned setup without manageArchivedSetups", async function () {
    const { res, updates } = await runCase("host", "admin", "bot", {
      permOverride(...args) {
        const firstIsUser = typeof args[0] === "string" || args[0] == null;
        const perm = firstIsUser ? args[1] : args[2];
        const needRank = firstIsUser ? args[2] : args[3];
        if (perm === "playGame") return true;
        if (perm === "manageArchivedSetups") return false;
        if (perm == null && needRank != null) return true;
        return false;
      },
    });
    res.statusCode.should.equal(403);
    updates.should.have.lengthOf(0);
  });

  it("hides system accounts from user search", async function () {
    let pipeline;
    models.User.aggregate = async (stages) => {
      pipeline = stages;
      return [];
    };
    redis.getUserStatus = async () => "offline";
    const res = makeMockRes();
    await handlers.search({ query: { query: "Setup" } }, res);
    pipeline[0].$match.systemAccount.should.deep.equal({ $ne: true });
    pipeline[0].$match.deleted.should.equal(false);
    res.body.should.deep.equal([]);
  });

  it("hides system accounts from online lists", async function () {
    let query;
    models.User.find = (filter) => {
      query = filter;
      return {
        select() {
          return this;
        },
        lean() {
          return Promise.resolve([{ id: "sys2" }]);
        },
      };
    };

    const users = await redis.filterSystemAccounts([
      { id: "human", name: "Human" },
      { id: constants.SETUP_ARCHIVIST_BOT_ID, name: "SetupArchivistBot" },
      { id: "sys2", name: "Other" },
    ]);

    query.systemAccount.should.equal(true);
    query.id.$in.should.include("human");
    users.map((user) => user.id).should.deep.equal(["human"]);
  });
});

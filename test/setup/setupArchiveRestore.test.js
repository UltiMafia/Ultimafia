const bluebird = require("bluebird");
const deletedKeys = [];
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
  delAsync: async (key) => {
    deletedKeys.push(key);
    return 1;
  },
};
const mockRedis = {
  createClient: () => mockRedisClient,
};
bluebird.promisifyAll(mockRedis);

const mockFirebase = {
  initializeApp() {},
  credential: { cert() { return {}; } },
  auth() {
    return { verifyIdToken: async () => ({}) };
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
const setupRouter = require("../../routes/setup");

// Other suite files may have loaded redis first. Record deletes on that client.
let previousDel;
let wrappedDel = false;
if (redis.client && redis.client !== mockRedisClient) {
  wrappedDel = true;
  previousDel = redis.client.delAsync;
  redis.client.delAsync = async function (key) {
    deletedKeys.push(key);
    if (typeof previousDel === "function") return previousDel.apply(this, arguments);
    return 1;
  };
}

const bot = "507f1f77bcf86cd799439012";
const deleted = "507f1f77bcf86cd799439021";
const target = "507f1f77bcf86cd799439022";
const live = "507f1f77bcf86cd799439023";
const fan = "507f1f77bcf86cd799439024";
const other = "507f1f77bcf86cd799439025";
const admin = "507f1f77bcf86cd799439014";
const kept = "507f1f77bcf86cd799439013";
const liveSetup = "507f1f77bcf86cd799439033";
const staleId = "507f1f77bcf86cd799439034";
const onDeleted = "507f1f77bcf86cd799439035";
const legacyId = "507f1f77bcf86cd799439036";

let users;
let setups;
let guides;
let games;
let comments;
let votes;
let versions;
let modActions;

function matches(doc, query) {
  if (!query) return true;
  for (const key of Object.keys(query)) {
    const expected = query[key];
    if (key === "$or") {
      if (!expected.some((part) => matches(doc, part))) return false;
      continue;
    }
    if (key === "$and") {
      if (!expected.every((part) => matches(doc, part))) return false;
      continue;
    }
    const actual = doc[key];
    if (expected instanceof RegExp) {
      if (!expected.test(String(actual || ""))) return false;
      continue;
    }
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (expected.$in) {
        const set = expected.$in.map(String);
        const values = Array.isArray(actual) ? actual : [actual];
        if (!values.some((item) => item != null && set.includes(String(item)))) {
          return false;
        }
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$ne")) {
        if (actual === expected.$ne) return false;
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$exists")) {
        const exists = actual !== undefined && actual !== null;
        if (expected.$exists !== exists) return false;
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(expected, "$gt")) {
        if (!(actual > expected.$gt)) return false;
        continue;
      }
    }
    if (String(actual) !== String(expected)) return false;
  }
  return true;
}

function applyUpdate(doc, update) {
  if (!update) return;
  const operators = ["$set", "$unset", "$push", "$pull", "$addToSet"];
  const hasOperator = operators.some((key) => update[key]);
  if (!hasOperator) Object.assign(doc, update);
  if (update.$set) {
    for (const key of Object.keys(update.$set)) doc[key] = update.$set[key];
  }
  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) delete doc[key];
  }
  if (update.$push) {
    for (const key of Object.keys(update.$push)) {
      if (!Array.isArray(doc[key])) doc[key] = [];
      doc[key].push(update.$push[key]);
    }
  }
  if (update.$pull) {
    for (const key of Object.keys(update.$pull)) {
      const val = String(update.$pull[key]);
      doc[key] = (doc[key] || []).filter((item) => String(item) !== val);
    }
  }
  if (update.$addToSet) {
    for (const key of Object.keys(update.$addToSet)) {
      if (!Array.isArray(doc[key])) doc[key] = [];
      const val = update.$addToSet[key];
      if (!doc[key].some((item) => String(item) === String(val))) {
        doc[key].push(val);
      }
    }
  }
}

function chain(get) {
  const query = {
    _pop: [],
    select() {
      return query;
    },
    populate(path) {
      query._pop.push(path);
      return query;
    },
    lean() {
      return query;
    },
    exec() {
      return Promise.resolve(get(query._pop));
    },
    then(resolve, reject) {
      return Promise.resolve(get(query._pop)).then(resolve, reject);
    },
  };
  return query;
}

function presentUser(user) {
  return JSON.parse(JSON.stringify(user));
}

function presentSetup(doc, populates) {
  const copy = JSON.parse(JSON.stringify(doc));
  for (const path of populates || []) {
    const id = doc[path];
    if (!id || typeof id === "object") continue;
    const user = users.find((item) => String(item._id) === String(id));
    if (!user) continue;
    copy[path] = {
      _id: user._id,
      id: user.id,
      deleted: !!user.deleted,
      systemAccount: !!user.systemAccount,
    };
  }
  return copy;
}

function writeQuery(list, filter, update, many) {
  return {
    exec: async () => {
      const docs = list.filter((doc) => matches(doc, filter));
      const chosen = many ? docs : docs.slice(0, 1);
      chosen.forEach((doc) => applyUpdate(doc, update));
      return { matchedCount: chosen.length };
    },
  };
}

function refuse(label) {
  return () => {
    throw new Error(label + " was written during restore");
  };
}

function userById(id) {
  return users.find((user) => user.id === id);
}

function setupById(id) {
  return setups.find((setup) => setup.id === id);
}

function stats() {
  return JSON.parse(
    JSON.stringify({
      setupStats: setups.map((setup) => ({
        id: setup.id,
        _id: setup._id,
        played: setup.played,
        favorites: setup.favorites || 0,
        voteCount: setup.voteCount || 0,
        upVotes: setup.upVotes || 0,
        downVotes: setup.downVotes || 0,
        factionRatings: setup.factionRatings || null,
        rolePlays: setup.rolePlays || null,
        roleWins: setup.roleWins || null,
      })),
      guides,
      games,
      comments,
      votes,
      versions,
      favs: users.map((user) => ({
        id: user.id,
        favSetups: user.favSetups || [],
      })),
    })
  );
}

function dump() {
  return JSON.parse(
    JSON.stringify({ users, setups, guides, games, comments, votes, versions })
  );
}

function reset() {
  users = [
    {
      _id: bot,
      id: constants.SETUP_ARCHIVIST_BOT_ID,
      systemAccount: true,
      deleted: false,
      banned: false,
      setups: [kept, staleId, legacyId],
      favSetups: [],
    },
    {
      _id: deleted,
      id: "deleted1",
      deleted: true,
      banned: false,
      setups: [onDeleted],
      favSetups: [],
    },
    {
      _id: target,
      id: "target1",
      deleted: false,
      banned: false,
      systemAccount: false,
      setups: [],
      favSetups: [],
    },
    {
      _id: live,
      id: "live1",
      deleted: false,
      banned: false,
      setups: [liveSetup],
      favSetups: [],
    },
    {
      _id: fan,
      id: "fan1",
      deleted: false,
      setups: [],
      favSetups: [kept],
    },
    {
      _id: other,
      id: "other1",
      deleted: false,
      setups: [],
      favSetups: [liveSetup],
    },
    {
      _id: admin,
      id: "admin1",
      deleted: false,
      setups: [],
      favSetups: [],
    },
    {
      _id: "507f1f77bcf86cd799439026",
      id: "sys1",
      systemAccount: true,
      deleted: false,
      banned: false,
      setups: [],
      favSetups: [],
    },
  ];
  setups = [
    {
      _id: kept,
      id: "setup-kept",
      name: "Kept",
      creator: bot,
      originalCreator: deleted,
      archived: true,
      archivedAt: 10,
      archivedBy: admin,
      archivedReason: "ownerDeleted",
      played: 7,
      favorites: 2,
      voteCount: 4,
      upVotes: 3,
      downVotes: 1,
      factionRatings: { Village: 1.5 },
      rolePlays: { Villager: 3 },
      roleWins: { Villager: 1 },
      ownershipHistory: [],
    },
    {
      _id: liveSetup,
      id: "setup-live",
      name: "Live",
      creator: live,
      originalCreator: deleted,
      archived: false,
      played: 9,
      favorites: 1,
      voteCount: 2,
      upVotes: 2,
      downVotes: 0,
      factionRatings: { Mafia: 0.5 },
      rolePlays: { Mafioso: 1 },
      roleWins: { Mafioso: 0 },
      ownershipHistory: [],
    },
    {
      _id: staleId,
      id: "setup-stale",
      name: "Stale transfer",
      creator: bot,
      originalCreator: deleted,
      archived: true,
      archivedAt: 11,
      archivedReason: "stale",
      played: 4,
      favorites: 3,
      voteCount: 1,
      upVotes: 1,
      downVotes: 0,
      ownershipHistory: [],
    },
    {
      _id: onDeleted,
      id: "setup-ondeleted",
      name: "Still deleted",
      creator: deleted,
      archived: true,
      archivedAt: 12,
      archivedReason: "ownerDeleted",
      played: 1,
      favorites: 0,
      voteCount: 0,
      upVotes: 0,
      downVotes: 0,
      ownershipHistory: [],
    },
    {
      _id: legacyId,
      id: "setup-2706",
      name: "Legacy archive",
      creator: bot,
      archived: true,
      archivedAt: 13,
      archivedReason: "ownerDeleted",
      played: 8,
      favorites: 1,
      voteCount: 1,
      upVotes: 1,
      downVotes: 0,
      ownershipHistory: [],
    },
  ];
  guides = [
    { _id: "g1", setup: kept, setupId: "setup-kept", author: deleted, title: "mine" },
    { _id: "g2", setup: kept, setupId: "setup-kept", author: other, title: "other" },
    { _id: "g3", setup: liveSetup, setupId: "setup-live", author: live, title: "live" },
  ];
  games = [
    { _id: "game1", id: "game-kept", setup: kept, endTime: 99 },
    { _id: "game2", id: "game-live", setup: liveSetup, endTime: 50 },
  ];
  comments = [{ _id: "c1", location: "setupsetup-kept", content: "still here" }];
  votes = [
    { voter: "fan1", item: "setup-kept", direction: 1 },
    { voter: "other1", item: "setup-live", direction: 1 },
  ];
  versions = [
    {
      _id: "v1",
      setup: kept,
      version: 2,
      played: 4,
      rolePlays: { Villager: 2 },
      roleWins: { Villager: 1 },
    },
  ];
  modActions = [];
  deletedKeys.length = 0;
}

function handlerFor(router, method, path) {
  const layer = router.stack.find(
    (entry) =>
      entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) return null;
  return layer.route.stack[0].handle;
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
  };
}

describe("POST /api/setup/restore", function () {
  const restore = handlerFor(setupRouter, "post", "/restore");
  const originals = {};

  before(function () {
    should.exist(restore);
    originals.userFind = models.User.findOne;
    originals.userUpdate = models.User.updateOne;
    originals.userCount = models.User.countDocuments;
    originals.setupFind = models.Setup.find;
    originals.setupFindOne = models.Setup.findOne;
    originals.setupUpdate = models.Setup.updateOne;
    originals.setupCreate = models.Setup.create;
    originals.setupInsert = models.Setup.insertMany;
    originals.setupDelete = models.Setup.deleteOne;
    originals.setupDeleteMany = models.Setup.deleteMany;
    originals.strategyCount = models.Strategy.countDocuments;
    originals.strategyUpdate = models.Strategy.updateMany;
    originals.gameCount = models.Game.countDocuments;
    originals.gameUpdate = models.Game.updateOne;
    originals.gameUpdateMany = models.Game.updateMany;
    originals.voteCount = models.ForumVote.countDocuments;
    originals.voteUpdate = models.ForumVote.updateOne;
    originals.commentUpdate = models.Comment.updateOne;
    originals.versionUpdate = models.SetupVersion.updateOne;
    originals.verify = routeUtils.verifyLoggedIn;
    originals.perm = routeUtils.verifyPermission;
    originals.modAction = routeUtils.createModAction;

    models.User.findOne = (query) =>
      chain(() => {
        const doc = users.find((item) => matches(item, query));
        return doc ? presentUser(doc) : null;
      });
    models.User.updateOne = (filter, update) => writeQuery(users, filter, update, false);
    models.User.countDocuments = async (filter) =>
      users.filter((item) => matches(item, filter)).length;
    models.Setup.find = (query) =>
      chain((pops) =>
        setups
          .filter((doc) => matches(doc, query))
          .map((doc) => presentSetup(doc, pops))
      );
    models.Setup.findOne = (query) =>
      chain((pops) => {
        const doc = setups.find((item) => matches(item, query));
        return doc ? presentSetup(doc, pops) : null;
      });
    models.Setup.updateOne = (filter, update) =>
      writeQuery(setups, filter, update, false);
    models.Setup.create = refuse("Setup.create");
    models.Setup.insertMany = refuse("Setup.insertMany");
    models.Setup.deleteOne = refuse("Setup.deleteOne");
    models.Setup.deleteMany = refuse("Setup.deleteMany");
    models.Strategy.countDocuments = async (filter) =>
      guides.filter((item) => matches(item, filter)).length;
    models.Strategy.updateMany = (filter, update) =>
      writeQuery(guides, filter, update, true);
    models.Game.countDocuments = async (filter) =>
      games.filter((item) => matches(item, filter)).length;
    models.Game.updateOne = refuse("Game.updateOne");
    models.Game.updateMany = refuse("Game.updateMany");
    models.ForumVote.countDocuments = async (filter) =>
      votes.filter((item) => matches(item, filter)).length;
    models.ForumVote.updateOne = refuse("ForumVote.updateOne");
    models.Comment.updateOne = refuse("Comment.updateOne");
    models.SetupVersion.updateOne = refuse("SetupVersion.updateOne");
    routeUtils.createModAction = async (modId, name, args) => {
      modActions.push({ modId, name, args });
    };
  });

  after(function () {
    models.User.findOne = originals.userFind;
    models.User.updateOne = originals.userUpdate;
    models.User.countDocuments = originals.userCount;
    models.Setup.find = originals.setupFind;
    models.Setup.findOne = originals.setupFindOne;
    models.Setup.updateOne = originals.setupUpdate;
    models.Setup.create = originals.setupCreate;
    models.Setup.insertMany = originals.setupInsert;
    models.Setup.deleteOne = originals.setupDelete;
    models.Setup.deleteMany = originals.setupDeleteMany;
    models.Strategy.countDocuments = originals.strategyCount;
    models.Strategy.updateMany = originals.strategyUpdate;
    models.Game.countDocuments = originals.gameCount;
    models.Game.updateOne = originals.gameUpdate;
    models.Game.updateMany = originals.gameUpdateMany;
    models.ForumVote.countDocuments = originals.voteCount;
    models.ForumVote.updateOne = originals.voteUpdate;
    models.Comment.updateOne = originals.commentUpdate;
    models.SetupVersion.updateOne = originals.versionUpdate;
    routeUtils.verifyLoggedIn = originals.verify;
    routeUtils.verifyPermission = originals.perm;
    routeUtils.createModAction = originals.modAction;
    if (wrappedDel && redis.client) {
      if (typeof previousDel === "function") redis.client.delAsync = previousDel;
      else delete redis.client.delAsync;
    }
  });

  beforeEach(function () {
    reset();
  });

  function allow(perm) {
    if (perm == null) return true;
    return perm === "restoreSetup" || perm === "manageArchivedSetups";
  }

  async function call(body, query, permCheck) {
    routeUtils.verifyLoggedIn = async () => "admin1";
    routeUtils.verifyPermission = async (userId, perm) =>
      (permCheck || allow)(perm, userId);
    const res = makeMockRes();
    await restore({ body: body || {}, query: query || {}, session: {} }, res);
    return res;
  }

  it("previews without writing and then restores one setup in place", async function () {
    const beforeStats = stats();
    const beforeDump = dump();

    const preview = await call(
      { toUserId: "target1", setupIds: ["setup-live", "setup-kept", "missing-one"] },
      { dryRun: "1" }
    );
    (preview.statusCode || 200).should.equal(200);
    preview.body.dryRun.should.equal(true);
    preview.body.unarchive.should.equal(true);
    preview.body.reassignGuides.should.equal(false);
    preview.body.counts.should.deep.equal({
      guides: 2,
      games: 1,
      favorites: 1,
      votes: 1,
    });
    preview.body.setups.map((row) => row.status).should.deep.equal([
      "skip",
      "restore",
    ]);
    preview.body.setups[0].reason.should.equal("liveOwner");
    preview.body.blockers.some((item) => item.code === "setupMissing").should.equal(
      true
    );
    dump().should.deep.equal(beforeDump);
    deletedKeys.should.have.lengthOf(0);
    modActions.should.have.lengthOf(0);

    const applied = await call({
      toUserId: "target1",
      setupIds: ["setup-live", "setup-kept", "missing-one"],
    });
    (applied.statusCode || 200).should.equal(200);
    applied.body.dryRun.should.equal(false);

    stats().should.deep.equal(beforeStats);
    setups.should.have.lengthOf(5);
    setups.map((setup) => setup.id).should.not.include("missing-one");

    const keptDoc = setupById("setup-kept");
    String(keptDoc.creator).should.equal(target);
    String(keptDoc.originalCreator).should.equal(deleted);
    keptDoc.archived.should.equal(false);
    should.not.exist(keptDoc.archivedAt);
    should.not.exist(keptDoc.archivedBy);
    should.not.exist(keptDoc.archivedReason);
    keptDoc.ownershipHistory.should.have.lengthOf(1);
    keptDoc.ownershipHistory[0].reason.should.equal("restore");
    String(keptDoc.ownershipHistory[0].from).should.equal(bot);
    String(keptDoc.ownershipHistory[0].to).should.equal(target);
    keptDoc.played.should.equal(7);
    keptDoc.factionRatings.should.deep.equal({ Village: 1.5 });

    const liveDoc = setupById("setup-live");
    String(liveDoc.creator).should.equal(live);
    liveDoc.ownershipHistory.should.have.lengthOf(0);
    liveDoc.played.should.equal(9);

    userById(constants.SETUP_ARCHIVIST_BOT_ID).setups.map(String).should.not.include(
      kept
    );
    userById("target1").setups.map(String).should.deep.equal([kept]);
    userById("live1").setups.map(String).should.deep.equal([liveSetup]);
    userById("deleted1").setups.map(String).should.deep.equal([onDeleted]);
    userById("fan1").favSetups.map(String).should.deep.equal([kept]);

    setupById("setup-stale").creator.should.equal(bot);
    setupById("setup-ondeleted").creator.should.equal(deleted);
    should.not.exist(setupById("setup-2706").originalCreator);

    deletedKeys.should.deep.equal([
      "game:featuredSetup:classic",
      "game:featuredSetup:main",
      "game:featuredSetup:minigames",
    ]);
    modActions.should.deep.equal([
      {
        modId: "admin1",
        name: "Restore Setups",
        args: ["to:target1", "from:setupIds", "setup-kept"],
      },
    ]);

    const again = await call({
      toUserId: "target1",
      setupIds: ["setup-live", "setup-kept"],
    });
    (again.statusCode || 200).should.equal(200);
    keptDoc.ownershipHistory.should.have.lengthOf(1);
    userById("target1").setups.should.have.lengthOf(1);
    modActions.should.have.lengthOf(1);
    deletedKeys.should.have.lengthOf(3);
    again.body.setups.find((row) => row.id === "setup-kept").status.should.equal(
      "already"
    );
  });

  it("leaves guides alone unless reassignGuides is set", async function () {
    const quiet = await call({
      toUserId: "target1",
      setupIds: ["setup-kept"],
      reassignGuides: false,
    });
    (quiet.statusCode || 200).should.equal(200);
    guides.map((guide) => guide.author).should.deep.equal([deleted, other, live]);

    reset();
    const moved = await call({
      toUserId: "target1",
      setupIds: ["setup-kept"],
      reassignGuides: true,
    });
    (moved.statusCode || 200).should.equal(200);
    moved.body.reassignGuides.should.equal(true);
    guides.find((guide) => guide._id === "g1").author.should.equal(target);
    guides.find((guide) => guide._id === "g2").author.should.equal(other);
    guides.find((guide) => guide._id === "g3").author.should.equal(live);
  });

  it("unarchives on a second run without a second history entry", async function () {
    const first = await call({
      toUserId: "target1",
      setupIds: ["setup-kept"],
      unarchive: false,
    });
    (first.statusCode || 200).should.equal(200);
    const keptDoc = setupById("setup-kept");
    keptDoc.archived.should.equal(true);
    keptDoc.archivedReason.should.equal("ownerDeleted");
    String(keptDoc.creator).should.equal(target);
    keptDoc.ownershipHistory.should.have.lengthOf(1);

    const second = await call({ toUserId: "target1", setupIds: ["setup-kept"] });
    (second.statusCode || 200).should.equal(200);
    keptDoc.archived.should.equal(false);
    should.not.exist(keptDoc.archivedReason);
    keptDoc.ownershipHistory.should.have.lengthOf(1);
    String(keptDoc.originalCreator).should.equal(deleted);
  });

  it("restores a stale transfer and a #2706 row by id, and a deleted owner's setups by fromUserId", async function () {
    const byId = await call({
      toUserId: "target1",
      setupIds: ["setup-2706"],
    });
    (byId.statusCode || 200).should.equal(200);
    const legacy = setupById("setup-2706");
    String(legacy.creator).should.equal(target);
    should.not.exist(legacy.originalCreator);
    legacy.played.should.equal(8);
    legacy.ownershipHistory.should.have.lengthOf(1);

    reset();
    const all = await call({ toUserId: "target1", fromUserId: "deleted1" });
    (all.statusCode || 200).should.equal(200);
    all.body.fromUserId.should.equal("deleted1");
    const restored = all.body.setups.filter((row) => row.status === "restore");
    restored.map((row) => row.id).sort().should.deep.equal([
      "setup-kept",
      "setup-ondeleted",
      "setup-stale",
    ]);
    all.body.skipped.map((row) => row.id).should.deep.equal(["setup-live"]);

    String(setupById("setup-kept").creator).should.equal(target);
    String(setupById("setup-stale").creator).should.equal(target);
    String(setupById("setup-stale").originalCreator).should.equal(deleted);
    String(setupById("setup-ondeleted").creator).should.equal(target);
    String(setupById("setup-live").creator).should.equal(live);
    userById("deleted1").setups.should.have.lengthOf(0);
    userById("target1").setups.map(String).sort().should.deep.equal(
      [kept, onDeleted, staleId].sort()
    );
    userById(constants.SETUP_ARCHIVIST_BOT_ID).setups.map(String).should.not.include(
      kept
    );
    modActions[0].name.should.equal("Restore Setups");
    modActions[0].args[0].should.equal("to:target1");
    modActions[0].args[1].should.equal("from:deleted1");
  });

  it("refuses the 500 cap without writing, including on a dry run", async function () {
    userById("target1").setups = Array.from({ length: 500 }, (_, i) => "pad-" + i);
    const preview = await call(
      { toUserId: "target1", setupIds: ["setup-kept"] },
      { dryRun: "1" }
    );
    (preview.statusCode || 200).should.equal(200);
    const cap = preview.body.blockers.find((item) => item.code === "cap");
    cap.owned.should.equal(500);
    cap.adding.should.equal(1);
    cap.max.should.equal(constants.maxOwnedSetups);
    preview.body.counts.guides.should.equal(2);
    setupById("setup-kept").creator.should.equal(bot);

    const applied = await call({ toUserId: "target1", setupIds: ["setup-kept"] });
    applied.statusCode.should.equal(409);
    String(applied.body).should.include("500");
    String(applied.body).should.include("1");
    setupById("setup-kept").creator.should.equal(bot);
    userById("target1").setups.should.have.lengthOf(500);
    modActions.should.have.lengthOf(0);
  });

  it("blocks a missing, deleted, banned, or system target and an empty selection", async function () {
    const missing = await call({ toUserId: "nobody", setupIds: ["setup-kept"] });
    missing.statusCode.should.equal(404);

    userById("target1").deleted = true;
    const gone = await call({ toUserId: "target1", setupIds: ["setup-kept"] });
    gone.statusCode.should.equal(409);
    String(gone.body).should.include("deleted");

    reset();
    userById("target1").banned = true;
    const banned = await call({ toUserId: "target1", setupIds: ["setup-kept"] });
    banned.statusCode.should.equal(409);
    String(banned.body).should.include("banned");

    reset();
    const system = await call({ toUserId: "sys1", setupIds: ["setup-kept"] });
    system.statusCode.should.equal(409);
    String(system.body).should.include("cannot own setups");

    const empty = await call({ toUserId: "target1" });
    empty.statusCode.should.equal(400);
    String(empty.body).should.include("setupIds");

    const fromMissing = await call({
      toUserId: "target1",
      fromUserId: "nobody",
    });
    fromMissing.statusCode.should.equal(404);

    setupById("setup-kept").creator.should.equal(bot);
    modActions.should.have.lengthOf(0);
  });

  it("rejects callers without restoreSetup before any write", async function () {
    const beforeDump = dump();
    const res = await call(
      { toUserId: "target1", setupIds: ["setup-kept"] },
      {},
      () => false
    );
    res.statusCode.should.equal(403);
    dump().should.deep.equal(beforeDump);
    modActions.should.have.lengthOf(0);
    deletedKeys.should.have.lengthOf(0);
  });
});

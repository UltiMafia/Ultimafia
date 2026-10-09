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
};
const mockRedis = { createClient: () => mockRedisClient };
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
const setupArchive = require("../../modules/setupArchive");
const setupRouter = require("../../routes/setup");

const owner = "507f1f77bcf86cd799439001";
const admin = "507f1f77bcf86cd799439002";
const live = "507f1f77bcf86cd799439003";
const deleted = "507f1f77bcf86cd799439004";
const bot = "507f1f77bcf86cd799439005";
const group = "507f1f77bcf86cd799439006";

let users;
let setups;
let groups;
let memberships;
let modActions;
let actorId;

function matches(doc, query) {
  if (!query) return true;
  for (const key of Object.keys(query)) {
    const expected = query[key];
    if (key === "$or") {
      if (!expected.some((part) => matches(doc, part))) return false;
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
    }
    if (String(actual) !== String(expected)) return false;
  }
  return true;
}

function applyUpdate(doc, update) {
  if (!update) return;
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

function setupDoc(id, oid, fields) {
  return Object.assign(
    {
      _id: oid,
      id,
      name: id,
      creator: live,
      played: 0,
      favorites: 0,
      ownershipHistory: [],
    },
    fields
  );
}

function reset() {
  const now = Date.now();
  const sixMonths = setupArchive.SIX_MONTHS_MS;
  const oneYear = setupArchive.ONE_YEAR_MS;
  const ancient = now - oneYear - sixMonths;
  users = [
    { _id: owner, id: "owner1", deleted: false, setups: [] },
    { _id: admin, id: "admin1", deleted: false, setups: [] },
    { _id: live, id: "live1", deleted: false, setups: [] },
    { _id: deleted, id: "deleted1", deleted: true, setups: ["507f1f77bcf86cd799439114"] },
    {
      _id: bot,
      id: constants.SETUP_ARCHIVIST_BOT_ID,
      systemAccount: true,
      deleted: false,
      setups: [],
    },
  ];
  setups = [
    setupDoc("s-low-stale", "507f1f77bcf86cd799439101", {
      played: 2,
      lastPlayedAt: now - sixMonths - 5000,
    }),
    setupDoc("s-low-fresh", "507f1f77bcf86cd799439102", {
      played: 2,
      lastPlayedAt: now - sixMonths + 60000,
    }),
    setupDoc("s-year-stale", "507f1f77bcf86cd799439103", {
      played: 10,
      lastPlayedAt: now - oneYear - 5000,
    }),
    setupDoc("s-year-fresh", "507f1f77bcf86cd799439104", {
      played: 10,
      lastPlayedAt: now - oneYear + 60000,
    }),
    setupDoc("s-mid-window", "507f1f77bcf86cd799439105", {
      played: 3,
      lastPlayedAt: now - sixMonths - 5000,
    }),
    setupDoc("s-29", "507f1f77bcf86cd799439106", {
      played: 29,
      lastPlayedAt: ancient,
    }),
    setupDoc("s-30", "507f1f77bcf86cd799439107", {
      played: 30,
      lastPlayedAt: ancient,
    }),
    setupDoc("s-featured", "507f1f77bcf86cd799439108", {
      featured: true,
      played: 0,
      lastPlayedAt: ancient,
    }),
    setupDoc("s-ranked", "507f1f77bcf86cd799439109", {
      ranked: true,
      played: 0,
      lastPlayedAt: ancient,
    }),
    setupDoc("s-competitive", "507f1f77bcf86cd799439110", {
      competitive: true,
      played: 0,
      lastPlayedAt: ancient,
    }),
    setupDoc("s-notime", "507f1f77bcf86cd799439111", { played: 1 }),
    setupDoc("s-fav", "507f1f77bcf86cd799439112", {
      played: 0,
      favorites: 8,
      lastPlayedAt: ancient,
    }),
    setupDoc("s-deleted", "507f1f77bcf86cd799439114", {
      creator: deleted,
      played: 0,
      lastPlayedAt: ancient,
    }),
  ];
  groups = [{ _id: group, name: "Owner" }];
  memberships = [{ _id: "507f1f77bcf86cd799439007", user: owner, group }];
  modActions = [];
  actorId = "owner1";
}

function sorted(list) {
  return list.slice().sort();
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

describe("POST /api/setup/archiveStale", function () {
  const archiveStale = handlerFor(setupRouter, "post", "/archiveStale");
  const originals = {};

  before(function () {
    should.exist(archiveStale);
    originals.userFind = models.User.findOne;
    originals.userUpdate = models.User.updateOne;
    originals.setupFind = models.Setup.find;
    originals.setupUpdate = models.Setup.updateOne;
    originals.setupUpdateMany = models.Setup.updateMany;
    originals.groupFind = models.Group.findOne;
    originals.inGroupFind = models.InGroup.findOne;
    originals.verify = routeUtils.verifyLoggedIn;
    originals.modAction = routeUtils.createModAction;

    models.User.findOne = (query) =>
      chain(() => {
        const doc = users.find((item) => matches(item, query));
        return doc ? JSON.parse(JSON.stringify(doc)) : null;
      });
    models.User.updateOne = (filter, update) =>
      writeQuery(users, filter, update, false);
    models.Setup.find = (query) =>
      chain((pops) =>
        setups
          .filter((doc) => matches(doc, query))
          .map((doc) => presentSetup(doc, pops))
      );
    models.Setup.updateOne = (filter, update) =>
      writeQuery(setups, filter, update, false);
    models.Setup.updateMany = (filter, update) =>
      writeQuery(setups, filter, update, true);
    models.Group.findOne = (query) =>
      chain(() => groups.find((item) => matches(item, query)) || null);
    models.InGroup.findOne = (query) =>
      chain(() => memberships.find((item) => matches(item, query)) || null);
    routeUtils.verifyLoggedIn = async () => actorId;
    routeUtils.createModAction = async (modId, name, args) => {
      modActions.push({ modId, name, args });
    };
  });

  after(function () {
    models.User.findOne = originals.userFind;
    models.User.updateOne = originals.userUpdate;
    models.Setup.find = originals.setupFind;
    models.Setup.updateOne = originals.setupUpdate;
    models.Setup.updateMany = originals.setupUpdateMany;
    models.Group.findOne = originals.groupFind;
    models.InGroup.findOne = originals.inGroupFind;
    routeUtils.verifyLoggedIn = originals.verify;
    routeUtils.createModAction = originals.modAction;
  });

  beforeEach(function () {
    reset();
  });

  async function call(body, query) {
    const res = makeMockRes();
    await archiveStale({ body: body || {}, query: query || {}, session: {} }, res);
    return res;
  }

  it("previews thresholds and exemptions, including favorited setups", async function () {
    const before = JSON.parse(JSON.stringify(setups));
    const res = await call(
      { dryRun: true, now: Date.now() + setupArchive.ONE_YEAR_MS * 5 },
      {}
    );
    (res.statusCode || 200).should.equal(200);
    res.body.dryRun.should.equal(true);
    res.body.confirmRequired.should.equal(true);
    sorted(res.body.matched.map((row) => row.id)).should.deep.equal(
      sorted(["s-low-stale", "s-year-stale", "s-29", "s-fav", "s-deleted"])
    );
    sorted(res.body.exempt.recent).should.deep.equal(
      sorted(["s-low-fresh", "s-year-fresh", "s-mid-window"])
    );
    res.body.exempt.played.should.deep.equal(["s-30"]);
    res.body.exempt.featured.should.deep.equal(["s-featured"]);
    res.body.exempt.ranked.should.deep.equal(["s-ranked"]);
    res.body.exempt.competitive.should.deep.equal(["s-competitive"]);
    res.body.exempt.noActivity.should.deep.equal(["s-notime"]);
    const fav = res.body.matched.find((row) => row.id === "s-fav");
    fav.favorites.should.equal(8);
    fav.transfer.should.equal(false);
    const orphan = res.body.matched.find((row) => row.id === "s-deleted");
    orphan.creatorDeleted.should.equal(true);
    orphan.transfer.should.equal(true);
    res.body.transfers.should.deep.equal(["s-deleted"]);
    res.body.count.should.equal(5);
    JSON.parse(JSON.stringify(setups)).should.deep.equal(before);
    modActions.should.have.lengthOf(0);
  });

  it("requires confirm and then archives, transferring only deleted creators", async function () {
    const bare = await call({});
    bare.body.dryRun.should.equal(true);
    bare.body.confirmRequired.should.equal(true);
    setups.every((setup) => setup.archived !== true).should.equal(true);

    const preview = await call({ confirm: true }, { dryRun: "1" });
    preview.body.dryRun.should.equal(true);
    preview.body.confirmRequired.should.equal(false);
    modActions.should.have.lengthOf(0);
    setups.every((setup) => setup.archived !== true).should.equal(true);

    const applied = await call({ confirm: "true" });
    (applied.statusCode || 200).should.equal(200);
    applied.body.dryRun.should.equal(false);
    applied.body.count.should.equal(5);

    const archived = setups.filter((setup) => setup.archived === true);
    sorted(archived.map((setup) => setup.id)).should.deep.equal(
      sorted(["s-low-stale", "s-year-stale", "s-29", "s-fav", "s-deleted"])
    );
    archived.every((setup) => setup.archivedReason === "stale").should.equal(true);

    const orphan = setups.find((setup) => setup.id === "s-deleted");
    String(orphan.creator).should.equal(bot);
    String(orphan.originalCreator).should.equal(deleted);
    orphan.ownershipHistory.should.have.lengthOf(1);
    orphan.ownershipHistory[0].reason.should.equal("stale");
    orphan.favorites.should.equal(0);
    orphan.played.should.equal(0);

    const fav = setups.find((setup) => setup.id === "s-fav");
    String(fav.creator).should.equal(live);
    fav.favorites.should.equal(8);
    should.not.exist(fav.originalCreator);
    fav.ownershipHistory.should.have.lengthOf(0);

    ["s-30", "s-featured", "s-ranked", "s-competitive", "s-notime", "s-low-fresh", "s-year-fresh", "s-mid-window"].forEach(
      (id) => {
        const setup = setups.find((item) => item.id === id);
        (setup.archived === true).should.equal(false);
      }
    );

    users.find((user) => user.id === "deleted1").setups.should.have.lengthOf(0);
    users
      .find((user) => user.id === constants.SETUP_ARCHIVIST_BOT_ID)
      .setups.map(String)
      .should.deep.equal(["507f1f77bcf86cd799439114"]);
    setups.should.have.lengthOf(13);

    modActions.should.have.lengthOf(1);
    modActions[0].name.should.equal("Archive Stale Setups");
    modActions[0].modId.should.equal("owner1");
    sorted(modActions[0].args).should.deep.equal(
      sorted(["s-low-stale", "s-year-stale", "s-29", "s-fav", "s-deleted"])
    );
  });

  it("rejects an admin who is not in the Owner group", async function () {
    actorId = "admin1";
    const before = JSON.parse(JSON.stringify(setups));
    const res = await call({ confirm: true });
    res.statusCode.should.equal(403);
    String(res.body).should.include("site owner");
    JSON.parse(JSON.stringify(setups)).should.deep.equal(before);
    modActions.should.have.lengthOf(0);
  });
});

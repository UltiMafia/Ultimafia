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

const mockFirebase = {
  initializeApp() {},
  credential: {
    cert() {
      return {};
    },
  },
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
const constants = require("../data/constants");
const models = require("../db/models");
const routeUtils = require("../routes/utils");
const redis = require("../modules/redis");
const setupRouter = require("../routes/setup");
const userRouter = require("../routes/user");

const ownerOid = "507f1f77bcf86cd799439011";
const setupOid = "507f1f77bcf86cd799439013";
const archivedId = "507f1f77bcf86cd799439021";
const publicId = "507f1f77bcf86cd799439022";
const removedMessage = "That setup does not exist. It may have been removed.";

function queryChain(value) {
  const query = {
    select() {
      return query;
    },
    populate() {
      return query;
    },
    sort() {
      return query;
    },
    skip() {
      return query;
    },
    limit() {
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

function archivedDoc(creatorId) {
  const doc = {
    _id: setupOid,
    id: "setup1",
    name: "Hidden",
    gameType: "Mafia",
    roles: "[]",
    version: 0,
    voteCount: 1,
    archived: true,
    creator: { id: creatorId, name: "Creator", avatar: false, tag: "" },
  };
  doc.toJSON = function () {
    const copy = Object.assign({}, this);
    delete copy.toJSON;
    return copy;
  };
  return doc;
}

describe("setup archive visibility", function () {
  const pageHandler = handlerFor(setupRouter, "get", "/:id");
  const lookupHandler = handlerFor(setupRouter, "get", "/id");
  const searchHandler = handlerFor(setupRouter, "get", "/search");
  const userSetupsHandler = handlerFor(userRouter, "get", "/:id/setups");
  const originals = {};

  before(function () {
    originals.userFind = models.User.findOne;
    originals.setupFind = models.Setup.find;
    originals.setupFindOne = models.Setup.findOne;
    originals.setupCount = models.Setup.countDocuments;
    originals.voteFind = models.ForumVote.findOne;
    originals.versionFind = models.SetupVersion.findOne;
    originals.gameCount = models.Game.countDocuments;
    originals.verify = routeUtils.verifyLoggedIn;
    originals.perm = routeUtils.verifyPermission;
    originals.favs = redis.getFavSetupsHashtable;
  });

  afterEach(function () {
    models.User.findOne = originals.userFind;
    models.Setup.find = originals.setupFind;
    models.Setup.findOne = originals.setupFindOne;
    models.Setup.countDocuments = originals.setupCount;
    models.ForumVote.findOne = originals.voteFind;
    models.SetupVersion.findOne = originals.versionFind;
    models.Game.countDocuments = originals.gameCount;
    routeUtils.verifyLoggedIn = originals.verify;
    routeUtils.verifyPermission = originals.perm;
    redis.getFavSetupsHashtable = originals.favs;
  });

  function stubDirect(doc) {
    let votes = 0;
    models.Setup.findOne = () => queryChain(doc);
    models.ForumVote.findOne = () => {
      votes += 1;
      return queryChain(null);
    };
    models.SetupVersion.findOne = () => queryChain(null);
    models.Game.countDocuments = async () => 0;
    return {
      votes() {
        return votes;
      },
    };
  }

  async function getSetup(userId, admin) {
    routeUtils.verifyLoggedIn = async () => userId;
    routeUtils.verifyPermission = async () => Boolean(admin);
    const tracked = stubDirect(archivedDoc("creator1"));
    const req = { params: { id: "setup1" }, session: {}, get() {} };
    const res = makeMockRes();
    await pageHandler(req, res);
    return { res, votes: tracked.votes() };
  }

  it("finds the direct, lookup, search, and profile setup handlers", function () {
    should.exist(pageHandler);
    should.exist(lookupHandler);
    should.exist(searchHandler);
    should.exist(userSetupsHandler);
  });

  it("hides an archived setup from a stranger", async function () {
    const { res, votes } = await getSetup(null, false);
    res.statusCode.should.equal(404);
    res.body.should.equal(removedMessage);
    votes.should.equal(0);
  });

  it("shows an archived setup to its creator", async function () {
    const { res, votes } = await getSetup("creator1", false);
    res.body.id.should.equal("setup1");
    votes.should.equal(1);
  });

  it("shows an archived setup to an admin", async function () {
    const { res } = await getSetup("admin1", true);
    res.body.id.should.equal("setup1");
  });

  it("hides a bot-owned setup from the original player", async function () {
    routeUtils.verifyLoggedIn = async () => "creator1";
    routeUtils.verifyPermission = async () => false;
    stubDirect(archivedDoc(constants.SETUP_ARCHIVIST_BOT_ID));
    const res = makeMockRes();
    await pageHandler(
      { params: { id: "setup1" }, session: {}, get() {} },
      res
    );
    res.statusCode.should.equal(404);
    res.body.should.equal(removedMessage);
  });

  it("returns the same not-found response for a missing id and a hidden archive", async function () {
    const versionHandler = handlerFor(
      setupRouter,
      "get",
      "/:id/version/:setupVersionNum"
    );
    const lineageHandler = handlerFor(setupRouter, "get", "/:id/lineage");
    should.exist(versionHandler);
    should.exist(lineageHandler);

    const lineageNotFound = "Setup not found.";

    async function responseFor(handler, params) {
      const res = makeMockRes();
      await handler({ params, session: {}, get() {} }, res);
      return { status: res.statusCode, body: res.body };
    }

    async function allResponses() {
      const page = await responseFor(pageHandler, { id: "setup1" });
      const version = await responseFor(versionHandler, {
        id: "setup1",
        setupVersionNum: "0",
      });
      const lineage = await responseFor(lineageHandler, { id: "setup1" });
      return { page, version, lineage };
    }

    routeUtils.verifyLoggedIn = async () => "stranger1";
    routeUtils.verifyPermission = async () => false;

    stubDirect(null);
    const missing = await allResponses();

    stubDirect(archivedDoc("someone-else"));
    const hidden = await allResponses();

    stubDirect(archivedDoc(constants.SETUP_ARCHIVIST_BOT_ID));
    const botOwned = await allResponses();

    missing.page.should.deep.equal({ status: 404, body: removedMessage });
    missing.version.should.deep.equal({ status: 404, body: removedMessage });
    missing.lineage.should.deep.equal({ status: 404, body: lineageNotFound });
    hidden.should.deep.equal(missing);
    botOwned.should.deep.equal(missing);
  });

  it("still serves an archived setup, its version, and its lineage to the creator and an admin", async function () {
    const versionHandler = handlerFor(
      setupRouter,
      "get",
      "/:id/version/:setupVersionNum"
    );
    const lineageHandler = handlerFor(setupRouter, "get", "/:id/lineage");

    function versionDoc() {
      const doc = { timestamp: 1, changelog: null, played: 2 };
      doc.toJSON = function () {
        const copy = Object.assign({}, this);
        delete copy.toJSON;
        return copy;
      };
      return doc;
    }

    async function asViewer(userId, admin, doc) {
      routeUtils.verifyLoggedIn = async () => userId;
      routeUtils.verifyPermission = async () => Boolean(admin);
      models.Setup.findOne = () => queryChain(doc);
      models.Setup.find = () => queryChain([]);
      models.SetupVersion.findOne = () => queryChain(versionDoc());
      models.ForumVote.findOne = () => queryChain(null);
      models.Game.countDocuments = async () => 0;

      const page = makeMockRes();
      await pageHandler(
        { params: { id: "setup1" }, session: {}, get() {} },
        page
      );
      const version = makeMockRes();
      await versionHandler(
        {
          params: { id: "setup1", setupVersionNum: "0" },
          session: {},
          get() {},
        },
        version
      );
      const lineage = makeMockRes();
      await lineageHandler(
        { params: { id: "setup1" }, session: {}, get() {} },
        lineage
      );
      return { page, version, lineage };
    }

    const creator = await asViewer("creator1", false, archivedDoc("creator1"));
    creator.page.body.id.should.equal("setup1");
    (creator.page.statusCode == null).should.equal(true);
    creator.version.body.played.should.equal(2);
    (creator.version.statusCode == null).should.equal(true);
    should.equal(creator.lineage.body.copiedFrom, null);
    creator.lineage.body.copiedTo.should.deep.equal([]);
    (creator.lineage.statusCode == null).should.equal(true);

    const admin = await asViewer(
      "admin1",
      true,
      archivedDoc(constants.SETUP_ARCHIVIST_BOT_ID)
    );
    admin.page.body.id.should.equal("setup1");
    admin.version.body.played.should.equal(2);
    admin.lineage.body.copiedTo.should.deep.equal([]);
  });

  it("returns an empty lookup for a stranger and the setup for its creator", async function () {
    models.Setup.findOne = () => queryChain(archivedDoc("creator1"));
    redis.getFavSetupsHashtable = async () => ({});

    routeUtils.verifyLoggedIn = async () => null;
    const hidden = makeMockRes();
    await lookupHandler(
      { query: { query: "setup1" }, session: {}, get() {} },
      hidden
    );
    hidden.body.setups.should.have.lengthOf(0);

    routeUtils.verifyLoggedIn = async () => "creator1";
    const visible = makeMockRes();
    await lookupHandler(
      { query: { query: "setup1" }, session: {}, get() {} },
      visible
    );
    visible.body.setups.should.have.lengthOf(1);
    visible.body.setups[0].id.should.equal("setup1");
    visible.body.setups[0].should.not.have.property("archived");
    visible.body.setups[0].should.not.have.property("creator");
  });

  it("excludes archived setups from public search", async function () {
    let captured;
    models.Setup.find = (search) => {
      captured = search;
      return queryChain([]);
    };
    models.Setup.countDocuments = async () => 0;
    routeUtils.verifyLoggedIn = async () => null;

    const res = makeMockRes();
    await searchHandler(
      { query: { gameType: "Mafia" }, session: {}, get() {} },
      res
    );

    captured.creator.should.deep.equal({ $exists: true });
    captured.archived.should.deep.equal({ $ne: true });
  });

  it("lets an admin show archived search results and ignores the flag for a stranger", async function () {
    const captured = [];
    models.Setup.find = (search) => {
      captured.push(search);
      return queryChain([]);
    };
    models.Setup.countDocuments = async () => 0;
    redis.getFavSetupsHashtable = async () => ({});

    routeUtils.verifyLoggedIn = async () => "admin1";
    routeUtils.verifyPermission = async () => true;
    await searchHandler(
      {
        query: { gameType: "Mafia", showArchived: "true" },
        session: { user: { id: "admin1" } },
        get() {},
      },
      makeMockRes()
    );
    captured[0].should.not.have.property("archived");
    captured[0].should.not.have.property("$and");

    routeUtils.verifyLoggedIn = async () => null;
    routeUtils.verifyPermission = async () => false;
    await searchHandler(
      {
        query: { gameType: "Mafia", showArchived: "1" },
        session: {},
        get() {},
      },
      makeMockRes()
    );
    captured[1].archived.should.deep.equal({ $ne: true });
  });

  it("lets a creator show their own archived setups in search", async function () {
    let captured;
    models.Setup.find = (search) => {
      captured = search;
      return queryChain([]);
    };
    models.Setup.countDocuments = async () => 0;
    models.User.findOne = () => queryChain({ _id: ownerOid });
    redis.getFavSetupsHashtable = async () => ({});
    routeUtils.verifyLoggedIn = async () => "creator1";
    routeUtils.verifyPermission = async () => false;

    await searchHandler(
      {
        query: { gameType: "Mafia", showArchived: "true" },
        session: { user: { id: "creator1" } },
        get() {},
      },
      makeMockRes()
    );

    captured.$and[0].should.deep.equal({
      $or: [
        { archived: { $ne: true } },
        { archived: true, creator: ownerOid },
      ],
    });
  });

  it("hides archived favorites unless the viewer can see them", async function () {
    let captured;
    models.Setup.find = (search) => {
      captured = search;
      return queryChain([]);
    };
    models.Setup.countDocuments = async () => 0;
    models.User.findOne = () =>
      queryChain({ favSetups: [{ _id: archivedId }] });
    redis.getFavSetupsHashtable = async () => ({});
    routeUtils.verifyLoggedIn = async () => "creator1";
    routeUtils.verifyPermission = async () => false;

    await searchHandler(
      {
        query: { gameType: "Mafia", option: "favorites" },
        session: { user: { _id: ownerOid, id: "creator1" } },
        get() {},
      },
      makeMockRes()
    );

    captured.archived.should.deep.equal({ $ne: true });
    captured._id.$in.should.deep.equal([archivedId]);
  });

  it("drops archived setups from a profile list and returns them to the owner", async function () {
    const finds = [];
    models.User.findOne = () =>
      queryChain({
        id: "creator1",
        setups: [archivedId, publicId],
      });
    models.Setup.find = (query) => {
      finds.push(query);
      if (query.archived === true) {
        return queryChain([{ _id: archivedId }]);
      }
      const ids = query._id.$in.map(String);
      return queryChain(
        ids.map((id) => ({
          _id: id,
          id: id === publicId ? "pubSetup" : "archSetup",
          name: "Named",
          gameType: "Mafia",
        }))
      );
    };

    routeUtils.verifyLoggedIn = async () => null;
    const hidden = makeMockRes();
    await userSetupsHandler(
      { params: { id: "creator1" }, query: {}, session: {} },
      hidden
    );
    hidden.body.total.should.equal(1);
    hidden.body.setups.should.have.lengthOf(1);
    hidden.body.setups[0].id.should.equal("pubSetup");
    finds[0].archived.should.equal(true);

    finds.length = 0;
    routeUtils.verifyLoggedIn = async () => "creator1";
    const shown = makeMockRes();
    await userSetupsHandler(
      {
        params: { id: "creator1" },
        query: { showArchived: "true" },
        session: {},
      },
      shown
    );
    shown.body.total.should.equal(2);
    shown.body.setups.map((setup) => setup.id).should.deep.equal([
      "archSetup",
      "pubSetup",
    ]);
    finds.should.have.lengthOf(1);
    finds[0].should.not.have.property("archived");
  });
});

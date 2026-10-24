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
    return {
      verifyIdToken: async () => ({
        email_verified: true,
        uid: "uid-system",
        email: "system@example.com",
      }),
    };
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
const authRouter = require("../routes/auth");
const userRouter = require("../routes/user");

function thenable(value) {
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

describe("setup archive login block", function () {
  const authHandler = handlerFor(authRouter, "post", "/");
  const nameHandler = handlerFor(userRouter, "post", "/name");
  let originalFind;
  let originalUpdate;
  let originalVerify;
  let originalPerm;
  let originalItems;
  let originalSiteActivity;

  before(function () {
    originalFind = models.User.findOne;
    originalUpdate = models.User.updateOne;
    originalVerify = routeUtils.verifyLoggedIn;
    originalPerm = routeUtils.verifyPermission;
    originalItems = redis.getUserItemsOwned;
    originalSiteActivity = models.SiteActivity.create;
  });

  afterEach(function () {
    models.User.findOne = originalFind;
    models.User.updateOne = originalUpdate;
    routeUtils.verifyLoggedIn = originalVerify;
    routeUtils.verifyPermission = originalPerm;
    redis.getUserItemsOwned = originalItems;
    models.SiteActivity.create = originalSiteActivity;
  });

  it("finds the auth and name handlers", function () {
    should.exist(authHandler);
    should.exist(nameHandler);
  });

  it("rejects a forged SetupArchivistBot session", async function () {
    let lookedUp = false;
    models.User.findOne = () => {
      lookedUp = true;
      return thenable({ systemAccount: false });
    };
    const req = {
      session: { user: { id: constants.SETUP_ARCHIVIST_BOT_ID } },
    };

    let message = null;
    try {
      await routeUtils.verifyLoggedIn(req);
    } catch (e) {
      message = e.message;
    }

    message.should.equal("Not logged in");
    lookedUp.should.equal(false);
    const ignored = await routeUtils.verifyLoggedIn(req, true);
    should.equal(ignored, undefined);
  });

  it("rejects a forged session for any system account", async function () {
    models.User.findOne = () => thenable({ systemAccount: true });
    const req = { session: { user: { id: "other-system-account" } } };

    let message = null;
    try {
      await routeUtils.verifyLoggedIn(req);
    } catch (e) {
      message = e.message;
    }

    message.should.equal("Not logged in");
    const ignored = await routeUtils.verifyLoggedIn(req, true);
    should.equal(ignored, undefined);
  });

  it("allows a normal session", async function () {
    models.User.findOne = () => thenable({ systemAccount: false });
    const id = await routeUtils.verifyLoggedIn({
      session: { user: { id: "normal-user" } },
    });
    id.should.equal("normal-user");
  });

  it("refuses auth for a systemAccount user", async function () {
    let sawSystemUser = false;
    models.User.findOne = (query) => {
      if (query && query.deleted === false && query.email) {
        sawSystemUser = true;
        return thenable({
          id: "sys1",
          _id: "oid-sys",
          systemAccount: true,
          fbUid: "uid-system",
          discordId: null,
        });
      }
      return thenable(null);
    };
    models.User.updateOne = () => thenable({});
    models.SiteActivity.create = () => Promise.resolve({});
    routeUtils.verifyPermission = async () => true;

    const req = {
      body: { idToken: "token" },
      session: {},
      headers: {},
      connection: {},
    };
    const res = makeMockRes();
    await authHandler(req, res);

    sawSystemUser.should.equal(true);
    res.statusCode.should.equal(403);
    should.not.exist(req.session.user);
  });

  it("reserves SetupArchivistBot on name change", async function () {
    routeUtils.verifyLoggedIn = async () => "user1";
    routeUtils.verifyPermission = async () => true;
    redis.getUserItemsOwned = async () => ({
      threeCharName: 1,
      twoCharName: 1,
      oneCharName: 1,
      nameChange: 1,
    });

    const req = {
      body: { name: "setuparchivistbot" },
      session: { user: { id: "user1" } },
    };
    const res = makeMockRes();
    await nameHandler(req, res);

    res.statusCode.should.equal(409);
    res.body.should.equal("There is already a user with this name.");
  });

  it("treats the reserved name as case-insensitive", function () {
    routeUtils.isReservedUsername("SetupArchivistBot").should.equal(true);
    routeUtils.isReservedUsername("  setuparchivistbot ").should.equal(true);
    routeUtils.isReservedUsername("SomeoneElse").should.equal(false);
  });
});

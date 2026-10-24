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
  credential: { cert() { return {}; } },
  auth() { return { verifyIdToken: async () => ({}) }; },
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
const userRouter = require("../routes/user");
const setupRouter = require("../routes/setup");

const ownerOid = "507f1f77bcf86cd799439011";
const botOid = "507f1f77bcf86cd799439012";
const setupOid = "507f1f77bcf86cd799439013";
const adminOid = "507f1f77bcf86cd799439014";

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

describe("setup archive deletion and admin archive", function () {
  const deleteHandler = handlerFor(userRouter, "post", "/delete");
  const archiveHandler = handlerFor(setupRouter, "post", "/archive");
  const originals = {};

  before(function () {
    originals.findOne = models.User.findOne;
    originals.userUpdate = models.User.updateOne;
    originals.setupFind = models.Setup.find;
    originals.setupFindOne = models.Setup.findOne;
    originals.setupUpdate = models.Setup.updateOne;
    originals.setupUpdateMany = models.Setup.updateMany;
    originals.verify = routeUtils.verifyLoggedIn;
    originals.perm = routeUtils.verifyPermission;
    originals.rate = routeUtils.rateLimit;
    originals.modAction = routeUtils.createModAction;
    originals.offline = redis.setUserOffline;
    originals.forget = redis.deleteUserInfo;
    [
      "ChannelOpen",
      "Notification",
      "Love",
      "LoveRequest",
      "DocSave",
      "Friend",
      "FriendRequest",
      "InGroup",
      "VanityUrl",
    ].forEach((name) => {
      originals[name] = models[name].deleteMany;
    });
  });

  afterEach(function () {
    models.User.findOne = originals.findOne;
    models.User.updateOne = originals.userUpdate;
    models.Setup.find = originals.setupFind;
    models.Setup.findOne = originals.setupFindOne;
    models.Setup.updateOne = originals.setupUpdate;
    models.Setup.updateMany = originals.setupUpdateMany;
    routeUtils.verifyLoggedIn = originals.verify;
    routeUtils.verifyPermission = originals.perm;
    routeUtils.rateLimit = originals.rate;
    routeUtils.createModAction = originals.modAction;
    redis.setUserOffline = originals.offline;
    redis.deleteUserInfo = originals.forget;
    [
      "ChannelOpen",
      "Notification",
      "Love",
      "LoveRequest",
      "DocSave",
      "Friend",
      "FriendRequest",
      "InGroup",
      "VanityUrl",
    ].forEach((name) => {
      models[name].deleteMany = originals[name];
    });
  });

  function stubDeletes() {
    [
      "ChannelOpen",
      "Notification",
      "Love",
      "LoveRequest",
      "DocSave",
      "Friend",
      "FriendRequest",
      "InGroup",
      "VanityUrl",
    ].forEach((name) => {
      models[name].deleteMany = () => thenable({});
    });
    redis.setUserOffline = async () => {};
    redis.deleteUserInfo = async () => {};
    routeUtils.verifyLoggedIn = async () => "ownerPub";
    routeUtils.rateLimit = async () => true;
  }

  it("finds the delete and archive handlers", function () {
    should.exist(deleteHandler);
    should.exist(archiveHandler);
  });

  it("moves a deleted user's setups to the bot and records originalCreator", async function () {
    stubDeletes();
    const setupUpdates = [];
    const userUpdates = [];

    models.User.findOne = (query) => {
      if (query && query.id === constants.SETUP_ARCHIVIST_BOT_ID) {
        return thenable({ _id: botOid, id: constants.SETUP_ARCHIVIST_BOT_ID });
      }
      if (query && query.id === "ownerPub") {
        return thenable({ _id: ownerOid, id: "ownerPub", setups: [setupOid] });
      }
      return thenable(null);
    };
    models.User.updateOne = (filter, update) => {
      userUpdates.push({ filter, update });
      return thenable({});
    };
    models.Setup.find = () =>
      thenable([
        {
          _id: setupOid,
          id: "setupPub",
          creator: ownerOid,
          originalCreator: null,
        },
      ]);
    models.Setup.updateOne = (filter, update) => {
      setupUpdates.push({ filter, update });
      return thenable({});
    };
    models.Setup.updateMany = (filter, update) => {
      setupUpdates.push({ filter, update, many: true });
      return thenable({});
    };

    const req = {
      session: {
        user: { id: "ownerPub", _id: ownerOid },
        destroy() {},
      },
      headers: {},
      connection: {},
    };
    const res = makeMockRes();
    await deleteHandler(req, res);

    res.statusCode.should.equal(200);

    const transfer = setupUpdates.find(
      (entry) => entry.update.$set && entry.update.$set.creator
    );
    should.exist(transfer);
    String(transfer.filter._id).should.equal(setupOid);
    String(transfer.update.$set.creator).should.equal(botOid);
    String(transfer.update.$set.originalCreator).should.equal(ownerOid);
    String(transfer.update.$push.ownershipHistory.from).should.equal(ownerOid);
    String(transfer.update.$push.ownershipHistory.to).should.equal(botOid);
    transfer.update.$push.ownershipHistory.reason.should.equal("ownerDeleted");

    const hidden = setupUpdates.find((entry) => entry.many);
    should.exist(hidden);
    hidden.update.$set.archived.should.equal(true);
    hidden.update.$set.archivedReason.should.equal("ownerDeleted");

    const pulled = userUpdates.find((entry) => entry.update.$pull);
    const added = userUpdates.find((entry) => entry.update.$addToSet);
    String(pulled.filter._id).should.equal(ownerOid);
    String(pulled.update.$pull.setups).should.equal(setupOid);
    String(added.filter._id).should.equal(botOid);
    String(added.update.$addToSet.setups).should.equal(setupOid);

    const markedDeleted = userUpdates.find(
      (entry) => entry.update.$set && entry.update.$set.deleted
    );
    markedDeleted.update.$set.deleted.should.equal(true);
  });

  it("still deletes the account when archiving setups throws", async function () {
    stubDeletes();
    const userUpdates = [];
    models.User.findOne = () => {
      throw new Error("archive store unavailable");
    };
    models.User.updateOne = (filter, update) => {
      userUpdates.push({ filter, update });
      return thenable({});
    };
    models.Setup.find = () => thenable([]);
    models.Setup.updateOne = () => thenable({});
    models.Setup.updateMany = () => thenable({});

    const req = {
      session: {
        user: { id: "ownerPub", _id: ownerOid },
        destroy() {},
      },
      headers: {},
      connection: {},
    };
    const res = makeMockRes();
    await deleteHandler(req, res);

    res.statusCode.should.equal(200);
    userUpdates.some((entry) => entry.update.$set && entry.update.$set.deleted)
      .should.equal(true);
  });

  it("admin archive uses the bot and hides the setup", async function () {
    routeUtils.verifyLoggedIn = async () => "admin1";
    routeUtils.verifyPermission = async () => true;
    routeUtils.createModAction = () => {};

    const setupUpdates = [];
    const userUpdates = [];
    models.Setup.findOne = () =>
      thenable({
        _id: setupOid,
        id: "setupPub",
        originalCreator: null,
        creator: { _id: ownerOid, id: "deletedUser", deleted: true },
      });
    models.User.findOne = (query) => {
      if (query && query.id === constants.SETUP_ARCHIVIST_BOT_ID) {
        return thenable({ _id: botOid, id: constants.SETUP_ARCHIVIST_BOT_ID });
      }
      if (query && query.id === "admin1") {
        return thenable({ _id: adminOid, id: "admin1" });
      }
      return thenable(null);
    };
    models.Setup.updateOne = (filter, update) => {
      setupUpdates.push({ filter, update });
      return thenable({});
    };
    models.Setup.updateMany = (filter, update) => {
      setupUpdates.push({ filter, update, many: true });
      return thenable({});
    };
    models.User.updateOne = (filter, update) => {
      userUpdates.push({ filter, update });
      return thenable({});
    };

    const req = {
      body: { id: "setupPub" },
      session: { user: { id: "admin1" } },
    };
    const res = makeMockRes();
    await archiveHandler(req, res);

    res.statusCode.should.equal(200);
    const transfer = setupUpdates.find(
      (entry) => entry.update.$set && entry.update.$set.originalCreator
    );
    String(transfer.update.$set.creator).should.equal(botOid);
    String(transfer.update.$set.originalCreator).should.equal(ownerOid);
    const hidden = setupUpdates.find((entry) => entry.many);
    hidden.update.$set.archived.should.equal(true);
    hidden.update.$set.archivedReason.should.equal("ownerDeleted");
    userUpdates.some((entry) => entry.update.$addToSet).should.equal(true);
    JSON.stringify(setupUpdates).should.not.contain("uBqs8KaDx");
    JSON.stringify(userUpdates).should.not.contain("uBqs8KaDx");
  });

  it("refuses to archive a setup whose owner is still active", async function () {
    routeUtils.verifyLoggedIn = async () => "admin1";
    routeUtils.verifyPermission = async () => true;
    let updates = 0;
    models.Setup.findOne = () =>
      thenable({
        _id: setupOid,
        id: "setupPub",
        creator: { _id: ownerOid, id: "liveUser", deleted: false },
      });
    models.Setup.updateOne = () => {
      updates += 1;
      return thenable({});
    };
    models.Setup.updateMany = () => {
      updates += 1;
      return thenable({});
    };

    const res = makeMockRes();
    await archiveHandler(
      { body: { id: "setupPub" }, session: { user: { id: "admin1" } } },
      res
    );

    res.statusCode.should.equal(409);
    res.body.should.equal("Setup owner is not deleted.");
    updates.should.equal(0);
  });
});

const bluebird = require("bluebird");
const mockRedisClient = {
  on: () => {},
  select: () => {},
  existsAsync: async () => false,
  set: () => {},
  cacheUserInfo: async () => {},
};
const mockRedis = {
  createClient: () => mockRedisClient,
};
bluebird.promisifyAll(mockRedis);

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
  if (name === "redis") {
    return mockRedis;
  }
  return originalRequire.apply(this, arguments);
};

const chai = require("chai");
const should = chai.should();
const router = require("../routes/user");
const models = require("../db/models");
const redis = require("../modules/redis");

Module.prototype.require = originalRequire;

function makeMockRes() {
  return {
    statusCode: null,
    body: null,
    setHeader() {},
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
  };
}

describe("routes/user - /settings/update cosmetics", function () {
  this.timeout(20000);

  let handler;
  let originalUpdateOne;
  let originalGetItems;
  let originalCache;

  before(function () {
    const layer = router.stack.find(
      (l) => l.route && l.route.path === "/settings/update"
    );
    if (layer) {
      handler = layer.route.stack[0].handle;
    }

    originalUpdateOne = models.User.updateOne;
    originalGetItems = redis.getUserItemsOwned;
    originalCache = redis.cacheUserInfo;
  });

  after(function () {
    models.User.updateOne = originalUpdateOne;
    redis.getUserItemsOwned = originalGetItems;
    redis.cacheUserInfo = originalCache;
  });

  async function postSetting(prop, value, itemsOwned) {
    let saved = null;
    redis.getUserItemsOwned = async () => itemsOwned;
    redis.cacheUserInfo = async () => true;
    models.User.updateOne = async (filter, update) => {
      saved = { filter, update };
      return {};
    };

    const req = {
      body: { prop, value },
      session: { user: { id: "user-cosmetics" } },
    };
    const res = makeMockRes();
    await handler(req, res);
    return { res, saved };
  }

  it("finds the /settings/update handler", function () {
    should.exist(handler);
  });

  it("saves ignoreNameFonts as a boolean via the allow-list", async function () {
    const { res, saved } = await postSetting("ignoreNameFonts", "true", {});

    res.statusCode.should.equal(200);
    saved.filter.id.should.equal("user-cosmetics");
    saved.update.$set["settings.ignoreNameFonts"].should.equal(true);
  });

  it("rejects gameAvatarShape square when the Square item is not owned", async function () {
    const { res, saved } = await postSetting("gameAvatarShape", "square", {
      avatarShape: 0,
    });

    res.statusCode.should.equal(403);
    String(res.body).should.match(/Square/);
    should.equal(saved, null);
  });

  it("saves gameAvatarShape square when the Square item is owned", async function () {
    const { res, saved } = await postSetting("gameAvatarShape", "square", {
      avatarShape: 1,
    });

    res.statusCode.should.equal(200);
    saved.filter.id.should.equal("user-cosmetics");
    saved.update.$set["settings.gameAvatarShape"].should.equal("square");
  });
});

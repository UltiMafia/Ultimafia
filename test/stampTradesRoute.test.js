const bluebird = require("bluebird");
const mockRedisClient = {
  on: () => {},
  select: () => {},
  existsAsync: async () => false,
  getAsync: async () => null,
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
const router = require("../routes/stampTrades");
const models = require("../db/models");

function makeMockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
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

function findHandler(path) {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods.get
  );
  return layer && layer.route.stack[0].handle;
}

function fakeQuery(result) {
  const q = {
    sort: () => q,
    limit: () => q,
    select: () => q,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
}

describe("routes/stampTrades - public feed endpoints", function () {
  let originalFind;
  let originalUpdateMany;
  let updateManyCalls;

  beforeEach(function () {
    originalFind = models.StampTrade.find;
    originalUpdateMany = models.StampTrade.updateMany;
    updateManyCalls = 0;
    models.StampTrade.find = () => fakeQuery([]);
    models.StampTrade.updateMany = async () => {
      updateManyCalls++;
    };
  });

  afterEach(function () {
    models.StampTrade.find = originalFind;
    models.StampTrade.updateMany = originalUpdateMany;
  });

  for (const path of ["/open", "/recent"]) {
    describe(`GET ${path}`, function () {
      it("returns 401 (not 500) for a logged-out visitor", async function () {
        const handler = findHandler(path);
        should.exist(handler);
        const res = makeMockRes();
        await handler({ session: {} }, res);
        res.statusCode.should.equal(401);
      });

      it("does not write to the DB for a logged-out visitor", async function () {
        const res = makeMockRes();
        await findHandler(path)({ session: {} }, res);
        updateManyCalls.should.equal(0);
      });

      it("returns 200 with a list for a logged-in user", async function () {
        const res = makeMockRes();
        await findHandler(path)({ devApi: { userId: "user1" }, session: {} }, res);
        res.statusCode.should.equal(200);
        res.body.should.be.an("array");
      });
    });
  }
});

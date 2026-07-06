const bluebird = require("bluebird");
const mockRedisClient = {
  on: () => {},
  select: () => {},
  existsAsync: async () => false,
  set: () => {},
  cacheUserInfo: async () => {}
};
const mockRedis = {
  createClient: () => mockRedisClient
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
const router = require("../routes/stockMarket");
const models = require("../db/models");

function makeMockRes() {
  const res = {
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
  };
  return res;
}

describe("routes/stockMarket - /transactions", function () {
  let handler;
  let originalStockTxCount;
  let originalStockTxFind;
  let originalFamilyStockTxCount;
  let originalFamilyStockTxFind;
  let originalUserFind;
  let originalFamilyFind;

  before(function () {
    const layer = router.stack.find(l => l.route && l.route.path === "/transactions");
    if (layer) {
      handler = layer.route.stack[0].handle;
    }

    originalStockTxCount = models.StockTransaction.estimatedDocumentCount;
    originalStockTxFind = models.StockTransaction.find;
    originalFamilyStockTxCount = models.FamilyStockTransaction.estimatedDocumentCount;
    originalFamilyStockTxFind = models.FamilyStockTransaction.find;
    originalUserFind = models.User.find;
    originalFamilyFind = models.Family.find;
  });

  after(function () {
    models.StockTransaction.estimatedDocumentCount = originalStockTxCount;
    models.StockTransaction.find = originalStockTxFind;
    models.FamilyStockTransaction.estimatedDocumentCount = originalFamilyStockTxCount;
    models.FamilyStockTransaction.find = originalFamilyStockTxFind;
    models.User.find = originalUserFind;
    models.Family.find = originalFamilyFind;
  });

  it("successfully finds the router handler for /transactions", function () {
    should.exist(handler);
  });

  it("handles player stock transactions list with pagination", async function () {
    models.StockTransaction.estimatedDocumentCount = () => {
      return {
        exec: async () => 100
      };
    };

    models.StockTransaction.find = () => {
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => ({
                exec: async () => [
                  {
                    _id: "tx1",
                    userId: "u1",
                    subjectId: "u2",
                    type: "buy",
                    shares: 10,
                    price: 2.5,
                    fee: 0.25,
                    createdAt: new Date("2026-07-01")
                  }
                ]
              })
            })
          })
        })
      };
    };

    models.User.find = (query) => {
      query.id.$in.should.contain("u1");
      query.id.$in.should.contain("u2");
      return {
        select: () => ({
          lean: () => ({
            exec: async () => [
              { id: "u1", name: "Buyer User", avatar: true, settings: { nameColor: "#ff0000", vanityUrl: "buyer" } },
              { id: "u2", name: "Subject User", avatar: false, settings: { nameColor: "#00ff00", vanityUrl: "subject" } }
            ]
          })
        })
      };
    };

    const req = {
      query: {
        marketMode: "player",
        page: "1",
        limit: "20"
      }
    };
    const res = makeMockRes();

    await handler(req, res);

    res.body.total.should.equal(100);
    res.body.page.should.equal(1);
    res.body.limit.should.equal(20);
    res.body.transactions.should.have.lengthOf(1);
    
    const tx = res.body.transactions[0];
    tx.id.should.equal("tx1");
    tx.buyerName.should.equal("Buyer User");
    tx.subjectName.should.equal("Subject User");
    tx.type.should.equal("buy");
    tx.shares.should.equal(10);
    tx.price.should.equal(2.5);
    tx.fee.should.equal(0.25);
  });

  it("handles family stock transactions list with pagination", async function () {
    models.FamilyStockTransaction.estimatedDocumentCount = () => {
      return {
        exec: async () => 50
      };
    };

    models.FamilyStockTransaction.find = () => {
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => ({
                exec: async () => [
                  {
                    _id: "tx2",
                    userId: "u1",
                    familyId: "f1",
                    type: "sell",
                    shares: 5,
                    price: 4.0,
                    fee: 0.4,
                    createdAt: new Date("2026-07-02")
                  }
                ]
              })
            })
          })
        })
      };
    };

    models.User.find = (query) => {
      query.id.$in.should.contain("u1");
      return {
        select: () => ({
          lean: () => ({
            exec: async () => [
              { id: "u1", name: "Seller User", avatar: true, settings: { nameColor: "#ff0000", vanityUrl: "seller" } }
            ]
          })
        })
      };
    };

    models.Family.find = (query) => {
      query.id.$in.should.contain("f1");
      return {
        select: () => ({
          lean: () => ({
            exec: async () => [
              { id: "f1", name: "Family ETF", avatar: true, background: true }
            ]
          })
        })
      };
    };

    const req = {
      query: {
        marketMode: "family",
        page: "2",
        limit: "10"
      }
    };
    const res = makeMockRes();

    await handler(req, res);

    res.body.total.should.equal(50);
    res.body.page.should.equal(2);
    res.body.limit.should.equal(10);
    res.body.transactions.should.have.lengthOf(1);

    const tx = res.body.transactions[0];
    tx.id.should.equal("tx2");
    tx.buyerName.should.equal("Seller User");
    tx.familyName.should.equal("Family ETF");
    tx.type.should.equal("sell");
    tx.shares.should.equal(5);
    tx.price.should.equal(4.0);
    tx.fee.should.equal(0.4);
  });

  it("handles filtering by search term and type", async function () {
    let userFindCallCount = 0;
    models.StockTransaction.countDocuments = (filter) => {
      filter.type.should.equal("buy");
      filter.$or[0].userId.$in.should.deep.equal(["u1"]);
      return {
        exec: async () => 5
      };
    };

    models.StockTransaction.find = (filter) => {
      filter.type.should.equal("buy");
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => ({
                exec: async () => [
                  {
                    _id: "tx1",
                    userId: "u1",
                    subjectId: "u2",
                    type: "buy",
                    shares: 10,
                    price: 2.5,
                    fee: 0.25,
                    createdAt: new Date("2026-07-01")
                  }
                ]
              })
            })
          })
        })
      };
    };

    models.User.find = (query) => {
      userFindCallCount++;
      if (userFindCallCount === 1) {
        query.name.$regex.should.equal("buyer");
        return {
          select: () => ({
            lean: () => ({
              exec: async () => [{ id: "u1" }]
            })
          })
        };
      } else {
        query.id.$in.should.contain("u1");
        return {
          select: () => ({
            lean: () => ({
              exec: async () => [
                { id: "u1", name: "Buyer User", avatar: true, settings: { nameColor: "#ff0000", vanityUrl: "buyer" } },
                { id: "u2", name: "Subject User", avatar: false, settings: { nameColor: "#00ff00", vanityUrl: "subject" } }
              ]
            })
          })
        };
      }
    };

    const req = {
      query: {
        marketMode: "player",
        page: "1",
        limit: "20",
        search: "buyer",
        type: "buy"
      }
    };
    const res = makeMockRes();

    await handler(req, res);

    res.body.total.should.equal(5);
    res.body.transactions.should.have.lengthOf(1);
    delete models.StockTransaction.countDocuments;
  });
});

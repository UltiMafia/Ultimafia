const bluebird = require("bluebird");
const mockRedisClient = {
  on: () => {},
  select: () => {},
  existsAsync: async () => false,
  set: () => {},
  subscribe: () => {},
  psubscribe: () => {},
  duplicate: () => mockRedisClient,
  smembersAsync: async () => [],
};
const mockRedisLib = { createClient: () => mockRedisClient };
bluebird.promisifyAll(mockRedisLib);

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
  if (name === "redis") return mockRedisLib;
  return originalRequire.apply(this, arguments);
};

const chai = require("chai");
const should = chai.should();
const constants = require("../data/constants");
const models = require("../db/models");
const redis = require("../modules/redis");
const routeUtils = require("../routes/utils");
const { finishedSkip, dedupeById } = require("../routes/gameListPaging");
const router = require("../routes/game");

const PAGE = constants.lobbyPageSize;

function liveGame(id, status) {
  return {
    id,
    type: "Mafia",
    lobby: "Main",
    status,
    hostId: "h",
    players: [],
    startTime: 1,
    settings: { setup: "s1", lobbyName: id },
  };
}

// A chainable stand-in for models.Game.find() over an in-memory list.
function fakeFind(docs, calls) {
  return (filter) => {
    const q = { _filter: filter, _sort: null, _skip: 0, _limit: Infinity };
    const chain = {
      select() {
        return chain;
      },
      sort(s) {
        q._sort = s;
        return chain;
      },
      skip(n) {
        q._skip = n;
        return chain;
      },
      limit(n) {
        q._limit = n;
        return chain;
      },
      populate() {
        return chain;
      },
      then(resolve, reject) {
        calls.push(q);
        let rows = docs.filter((d) => !filter.lobby || d.lobby === filter.lobby);
        if (filter.endTime && filter.endTime.$lt !== undefined)
          rows = rows.filter((d) => d.endTime < filter.endTime.$lt);
        rows = rows.slice().sort((a, b) => b.endTime - a.endTime);
        rows = rows.slice(q._skip, q._skip + q._limit);
        return Promise.resolve(
          rows.map((d) => ({ ...d, toJSON: () => ({ ...d }) }))
        ).then(resolve, reject);
      },
    };
    return chain;
  };
}

describe("Game list paging helpers", function () {
  it("skips the finished games shown on earlier pages", function () {
    finishedSkip(0, 3).should.equal(0);
    finishedSkip(10, 3).should.equal(7);
    finishedSkip(20, 3).should.equal(17);
    finishedSkip(10, 25).should.equal(0);
  });

  it("keeps the first game per id and drops ids already listed", function () {
    const out = dedupeById(
      [{ id: "a" }, { id: "b" }, { id: "a" }, { id: "c" }, null],
      ["c"]
    );
    out.map((g) => g.id).should.deep.equal(["a", "b"]);
  });
});

describe("GET /api/game/list paging", function () {
  let handler;
  const saved = {};
  let finishedDocs;
  let liveGames;
  let calls;

  before(function () {
    const layer = router.stack.find((l) => l.route && l.route.path === "/list");
    handler = layer.route.stack[0].handle;

    saved.verifyLoggedIn = routeUtils.verifyLoggedIn;
    saved.verifyPermission = routeUtils.verifyPermission;
    saved.getOpenPublicGames = redis.getOpenPublicGames;
    saved.getInProgressPublicGames = redis.getInProgressPublicGames;
    saved.gameFind = models.Game.find;
    saved.setupFind = models.Setup.find;

    routeUtils.verifyLoggedIn = async () => null;
    routeUtils.verifyPermission = async () => false;
    redis.getOpenPublicGames = async () => liveGames.filter((g) => g.status === "Open");
    redis.getInProgressPublicGames = async () =>
      liveGames.filter((g) => g.status === "In Progress");
    models.Setup.find = () => ({ select: async () => [] });
  });

  after(function () {
    routeUtils.verifyLoggedIn = saved.verifyLoggedIn;
    routeUtils.verifyPermission = saved.verifyPermission;
    redis.getOpenPublicGames = saved.getOpenPublicGames;
    redis.getInProgressPublicGames = saved.getInProgressPublicGames;
    models.Game.find = saved.gameFind;
    models.Setup.find = saved.setupFind;
  });

  beforeEach(function () {
    calls = [];
    liveGames = [liveGame("open1", "Open"), liveGame("prog1", "In Progress")];
    finishedDocs = [];
    for (let i = 0; i < 35; i++)
      finishedDocs.push({ id: `f${i}`, lobby: "Main", endTime: 1000 - i });
    models.Game.find = fakeFind(finishedDocs, calls);
  });

  async function getPage(query) {
    const res = {
      body: null,
      setHeader() {},
      send(body) {
        this.body = body;
      },
    };
    await handler({ query: { list: "all", lobby: "Main", ...query } }, res);
    return res.body.map((g) => g.id);
  }

  it("returns different finished games on pages 1, 2 and 3", async function () {
    // The client sends the endTime of its last row as `last`; with live games
    // on page 1 that is 0, which used to make every page repeat page 1.
    const p1 = await getPage({ page: "1", last: "Infinity" });
    const p2 = await getPage({ page: "2", last: "0" });
    const p3 = await getPage({ page: "3", last: "0" });

    p1.should.deep.equal(
      ["open1", "prog1"].concat([0, 1, 2, 3, 4, 5, 6, 7].map((i) => `f${i}`))
    );
    p2.should.deep.equal([8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((i) => `f${i}`));
    p3.should.deep.equal([18, 19, 20, 21, 22, 23, 24, 25, 26, 27].map((i) => `f${i}`));
    calls.map((c) => c._skip).should.deep.equal([0, 8, 18]);
  });

  it("drops a repeated finished id and still fills the page", async function () {
    finishedDocs.splice(2, 0, { id: "f1", lobby: "Main", endTime: 999 });
    const p1 = await getPage({ page: "1" });

    p1.length.should.equal(PAGE);
    new Set(p1).size.should.equal(PAGE);
    p1.filter((id) => id === "f1").length.should.equal(1);
  });

  it("does not list a finished game that is also live", async function () {
    liveGames.push(liveGame("f0", "In Progress"));
    const p1 = await getPage({ page: "1" });

    p1.filter((id) => id === "f0").length.should.equal(1);
    p1.length.should.equal(PAGE);
  });

  it("keeps the cursor behaviour when no page is sent", async function () {
    const ids = await getPage({ list: "finished", last: "995" });

    ids[0].should.equal("f6");
    should.equal(calls[0]._skip, 0);
  });
});

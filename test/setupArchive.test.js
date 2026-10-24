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

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (name) {
  if (name === "redis") return mockRedis;
  return originalRequire.apply(this, arguments);
};

const chai = require("chai");
const should = chai.should();
const constants = require("../data/constants");
const {
  isStale,
  SIX_MONTHS_MS,
  ONE_YEAR_MS,
} = require("../modules/setupArchive");

describe("modules/setupArchive isStale", function () {
  const now = Date.UTC(2026, 0, 1);

  function setup(overrides) {
    return {
      played: 0,
      lastPlayedAt: now - SIX_MONTHS_MS,
      featured: false,
      ranked: false,
      competitive: false,
      favorites: 0,
      ...overrides,
    };
  }

  it("archives a setup played fewer than 3 times after 6 months idle", function () {
    isStale(setup({ played: 0 }), now).should.equal(true);
    isStale(setup({ played: 2 }), now).should.equal(true);
    isStale(
      setup({ played: 2, lastPlayedAt: now - SIX_MONTHS_MS + 1 }),
      now
    ).should.equal(false);
  });

  it("archives a setup played 3 to 29 times only after 1 year idle", function () {
    isStale(setup({ played: 3 }), now).should.equal(false);
    isStale(setup({ played: 29, lastPlayedAt: now - ONE_YEAR_MS }), now).should.equal(
      true
    );
    isStale(
      setup({ played: 29, lastPlayedAt: now - ONE_YEAR_MS + 1 }),
      now
    ).should.equal(false);
    isStale(setup({ played: 3, lastPlayedAt: now - ONE_YEAR_MS }), now).should.equal(
      true
    );
  });

  it("never archives a setup played 30 or more times", function () {
    isStale(
      setup({ played: 30, lastPlayedAt: now - ONE_YEAR_MS * 5 }),
      now
    ).should.equal(false);
    isStale(
      setup({ played: 100, lastPlayedAt: 0 }),
      now
    ).should.equal(false);
  });

  it("exempts featured, ranked, and competitive setups", function () {
    const old = { played: 0, lastPlayedAt: now - ONE_YEAR_MS * 2 };
    isStale(setup({ ...old, featured: true }), now).should.equal(false);
    isStale(setup({ ...old, ranked: true }), now).should.equal(false);
    isStale(setup({ ...old, competitive: true }), now).should.equal(false);
  });

  it("does not exempt favorited setups", function () {
    isStale(setup({ played: 0, favorites: 40 }), now).should.equal(true);
  });

  it("falls back from lastPlayedAt to updatedAt and then createdAt", function () {
    isStale(
      setup({
        lastPlayedAt: now - 1000,
        updatedAt: now - ONE_YEAR_MS,
        played: 0,
      }),
      now
    ).should.equal(false);

    isStale(
      setup({
        lastPlayedAt: null,
        updatedAt: now - SIX_MONTHS_MS,
        createdAt: now,
        played: 1,
      }),
      now
    ).should.equal(true);

    isStale(
      setup({
        lastPlayedAt: undefined,
        updatedAt: undefined,
        createdAt: now - SIX_MONTHS_MS,
        played: 0,
      }),
      now
    ).should.equal(true);
  });

  it("is not stale when no activity timestamp exists", function () {
    isStale(
      setup({
        lastPlayedAt: undefined,
        updatedAt: undefined,
        createdAt: undefined,
        played: 0,
      }),
      now
    ).should.equal(false);
  });

  it("exposes the fixed archivist bot id", function () {
    constants.SETUP_ARCHIVIST_BOT_ID.should.equal("setup-archivist-bot");
    constants.SETUP_ARCHIVIST_BOT_NAME.should.equal("SetupArchivistBot");
  });
});

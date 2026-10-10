const chai = require("chai");
const { createFingerprintMongo } = require("./helpers/fingerprintMongo");

const should = chai.should();

// These tests intentionally load the production router and utils module.  The
// only substitutes are process boundaries (Redis, logging, Firebase, and game
// services); Mongo models, getAltAccountIds, and banUser remain real.
function loadModerationRouter(models, redis) {
  const paths = [
    "../db/models",
    "../modules/redis",
    "../modules/logging",
    "../modules/gameLoadBalancer",
    "../modules/roleIconCreditUtils",
    "../modules/fortunePoints",
    "../modules/skillRating",
    "firebase-admin",
    "../modules/accountLinkage",
    "../routes/utils",
    "../routes/mod",
  ].map(require.resolve);
  const previous = new Map(paths.map((path) => [path, require.cache[path]]));
  const put = (request, exports) => {
    const path = require.resolve(request);
    require.cache[path] = { id: path, filename: path, loaded: true, exports };
  };

  put("../db/models", models);
  put("../modules/redis", redis);
  put("../modules/logging", () => ({ error() {}, warn() {}, info() {} }));
  put("../modules/gameLoadBalancer", { leaveGame: async () => {} });
  put("../modules/roleIconCreditUtils", {});
  put("../modules/fortunePoints", {});
  put("../modules/skillRating", {});
  put("firebase-admin", {});
  delete require.cache[require.resolve("../modules/accountLinkage")];
  delete require.cache[require.resolve("../routes/utils")];
  delete require.cache[require.resolve("../routes/mod")];
  const router = require("../routes/mod");

  return {
    router,
    restore() {
      for (const path of paths) {
        if (previous.get(path)) require.cache[path] = previous.get(path);
        else delete require.cache[path];
      }
    },
  };
}

function findHandler(router, method, path) {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) throw new Error(`Missing ${method.toUpperCase()} ${path}`);
  return layer.route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    send(value) { this.body = value; return this; },
    json(value) { this.body = value; return this; },
    sendStatus(code) { this.statusCode = code; this.body = String(code); return this; },
  };
}

function request({ userId = "mod", body = {}, query = {} } = {}) {
  return { session: { user: { id: userId } }, body, query, headers: {}, connection: {} };
}

function fingerprint(stable, platform = "web") {
  return { platform, stable, unstable: "device" };
}

describe("moderation fingerprint parity endpoints", function () {
  this.timeout(15000);
  let database;
  let models;
  let routerLoad;
  let handlers;
  let ranks;
  let allowed;

  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    ranks = new Map();
    allowed = new Set();
    const redis = {
      async getUserRank(id) { return ranks.get(id); },
      async hasPermission(id, permission, rank) {
        return allowed.has(`${id}:${permission || "*"}`) && (rank == null || (ranks.get(id) || 0) >= rank);
      },
      async hasPermissions() { return false; },
      async cacheUserPermissions() {},
      async cacheUserInfo() {},
      async getUserStatus() { return "offline"; },
      async getBasicUserInfo() { return null; },
    };
    routerLoad = loadModerationRouter(models, redis);
    handlers = {
      alts: findHandler(routerLoad.router, "get", "/alts"),
      ban: findHandler(routerLoad.router, "post", "/ban"),
      unban: findHandler(routerLoad.router, "post", "/unban"),
      unlink: findHandler(routerLoad.router, "post", "/unlinkAccounts"),
      clear: findHandler(routerLoad.router, "post", "/clearAllIPs"),
    };
  });

  after(async function () {
    if (routerLoad) routerLoad.restore();
    if (database) await database.close();
  });

  beforeEach(async function () {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
    ranks.clear();
    allowed.clear();
    ranks.set("mod", 10);
    ["ban", "unban", "viewAlts", "clearAllIPs"].forEach((permission) => allowed.add(`mod:${permission}`));
  });

  async function users(documents) {
    await models.User.create(documents.map((document) => ({ deleted: false, ...document })));
  }

  it("/alts returns exact, de-duplicated IP and fingerprint matches without exposing fingerprints", async function () {
    await users([
      { id: "target", name: "Target", ip: ["198.51.100.1"], fingerprints: [fingerprint("shared")] },
      { id: "both", name: "Both", ip: ["198.51.100.1"], fingerprints: [fingerprint("shared")] },
      { id: "ip-only", name: "IP", ip: ["198.51.100.1"] },
      { id: "fingerprint-only", name: "Fingerprint", fingerprints: [fingerprint("shared")] },
      { id: "different-platform", name: "Other", fingerprints: [fingerprint("shared", "ios")] },
      { id: "different-stable", name: "Other2", fingerprints: [fingerprint("other")] },
    ]);
    const res = response();
    await handlers.alts(request({ query: { userId: "target" } }), res);

    res.statusCode.should.equal(200);
    res.body.map((user) => user.id).sort().should.deep.equal(["both", "fingerprint-only", "ip-only", "target"]);
    JSON.stringify(res.body).should.not.contain("fingerprints");
    new Set(res.body.map((user) => user.id)).size.should.equal(res.body.length);
  });

  [
    ["forum", "forum"], ["chat", "chat"], ["game", "game"],
    ["ranked", "playRanked"], ["competitive", "playCompetitive"], ["site", "site"],
  ].forEach(([banType, storedType]) => {
    it(`/ban ${banType} persists real bans for IP-only and fingerprint-only alts but excludes higher ranks`, async function () {
      await users([
        { id: "target", name: "Target", ip: ["198.51.100.2"], fingerprints: [fingerprint("ban-shared")] },
        { id: "ip-alt", name: "IP alt", ip: ["198.51.100.2"] },
        { id: "fingerprint-alt", name: "Fingerprint alt", fingerprints: [fingerprint("ban-shared")] },
        { id: "higher-alt", name: "Higher", fingerprints: [fingerprint("ban-shared")] },
      ]);
      ["target", "ip-alt", "fingerprint-alt"].forEach((id) => ranks.set(id, 2));
      ranks.set("higher-alt", 11);
      await models.Session.create([
        { session: { user: { id: "target" } } },
        { session: { user: { id: "ip-alt" } } },
        { session: { user: { id: "fingerprint-alt" } } },
      ]);
      const res = response();
      await handlers.ban(request({ body: { userId: "target", length: "1 hour", banType } }), res);

      res.statusCode.should.equal(200);
      const bans = await models.Ban.find({ type: storedType, auto: false }).lean();
      bans.map((ban) => ban.userId).sort().should.deep.equal(["fingerprint-alt", "ip-alt", "target"]);
      if (banType === "site") {
        const banned = await models.User.find({ banned: true }).select("id -_id").lean();
        banned.map((user) => user.id).sort().should.deep.equal(["fingerprint-alt", "ip-alt", "target"]);
        (await models.Session.countDocuments({})).should.equal(0);
      }
    });
  });

  it("/unban reverses direct fingerprint and IP bans while preserving auto bans", async function () {
    await users([
      { id: "target", name: "Target", ip: ["198.51.100.3"], fingerprints: [fingerprint("unban-shared")] },
      { id: "ip-alt", name: "IP", ip: ["198.51.100.3"] },
      { id: "fingerprint-alt", name: "FP", fingerprints: [fingerprint("unban-shared")] },
    ]);
    ["target", "ip-alt", "fingerprint-alt"].forEach((id) => ranks.set(id, 2));
    const banRes = response();
    await handlers.ban(request({ body: { userId: "target", length: "1 hour", banType: "site" } }), banRes);
    await models.Ban.create({ id: "automatic", userId: "fingerprint-alt", type: "site", auto: true, expires: 0, permissions: ["signIn"] });
    const res = response();
    await handlers.unban(request({ body: { userId: "target", banType: "site" } }), res);

    res.statusCode.should.equal(200);
    const remaining = await models.Ban.find({ type: "site" }).lean();
    remaining.map((ban) => `${ban.userId}:${ban.auto}`).should.deep.equal(["fingerprint-alt:true"]);
    (await models.User.countDocuments({ banned: true })).should.equal(0);
  });

  it("/ban refuses a target at the moderator's rank and writes no bans", async function () {
    await users([{ id: "equal-rank", name: "Equal", fingerprints: [fingerprint("rank")]}]);
    ranks.set("equal-rank", 10);
    const res = response();
    await handlers.ban(request({ body: { userId: "equal-rank", length: "1 hour", banType: "site" } }), res);
    res.statusCode.should.equal(403);
    (await models.Ban.countDocuments({})).should.equal(0);
  });

  ["ip", "fingerprint"].forEach((linkType) => {
    it(`/unlinkAccounts removes shared ${linkType} evidence and /alts no longer returns the counterpart`, async function () {
      const shared = linkType === "ip" ? { ip: ["198.51.100.4"] } : { fingerprints: [fingerprint("unlink-shared")] };
      await users([{ id: "one", name: "One", ...shared }, { id: "two", name: "Two", ...shared }]);
      const res = response();
      await handlers.unlink(request({ body: { userId1: "one", userId2: "two" } }), res);
      res.statusCode.should.equal(200);
      if (linkType === "ip") res.body.removed.should.deep.equal(["198.51.100.4"]);
      else res.body.removedFingerprintCount.should.equal(1);
      const alts = response();
      await handlers.alts(request({ query: { userId: "one" } }), alts);
      alts.body.map((user) => user.id).should.deep.equal(["one"]);
    });
  });

  it("/unlinkAccounts denies insufficient permissions and rejects missing or self arguments", async function () {
    await users([{ id: "one", name: "One" }, { id: "two", name: "Two" }]);
    allowed.delete("mod:viewAlts");
    const denied = response();
    await handlers.unlink(request({ body: { userId1: "one", userId2: "two" } }), denied);
    denied.statusCode.should.equal(403);
    allowed.add("mod:viewAlts");
    const missing = response();
    await handlers.unlink(request({ body: { userId1: "one" } }), missing);
    missing.statusCode.should.equal(400);
    const self = response();
    await handlers.unlink(request({ body: { userId1: "one", userId2: "one" } }), self);
    self.statusCode.should.equal(400);
  });

  it("/clearAllIPs clears both IP and fingerprint evidence", async function () {
    await users([{ id: "one", name: "One", ip: ["198.51.100.5"], fingerprints: [fingerprint("clear")] }]);
    const res = response();
    await handlers.clear(request(), res);
    res.statusCode.should.equal(200);
    const user = await models.User.findOne({ id: "one" }).lean();
    should.equal(user.ip, undefined);
    should.equal(user.fingerprints, undefined);
  });
});

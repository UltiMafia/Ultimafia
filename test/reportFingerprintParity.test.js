const assert = require("node:assert/strict");
const { createFingerprintMongo } = require("./helpers/fingerprintMongo");
const { violationDefinitions } = require("../data/violations");

describe("report workflow fingerprint/IP parity", function () {
  this.timeout(20000);
  let database, models, modRouter, userRouter;
  const previous = new Map();
  const permissions = new Set();
  const cachedPermissions = [];
  const loggedErrors = [];

  function replace(relative, exports) {
    const filename = require.resolve(relative);
    if (!previous.has(filename)) previous.set(filename, require.cache[filename]);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  }
  function reload(relative) {
    const filename = require.resolve(relative);
    if (!previous.has(filename)) previous.set(filename, require.cache[filename]);
    delete require.cache[filename];
    return require(relative);
  }
  function handler(router, endpoint) {
    return router.stack.find((layer) => layer.route && layer.route.path === endpoint).route.stack[0].handle;
  }
  function request(userId, body = {}, id = "case") {
    return { session: { user: { id: userId } }, body, params: { id }, headers: {}, connection: {} };
  }
  function response() {
    return {
      statusCode: 200, body: null,
      setHeader() {},
      status(code) { this.statusCode = code; return this; },
      send(body) { this.body = body; return this; },
      sendStatus(code) { this.statusCode = code; return this; },
    };
  }

  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    replace("../db/models", models);
    replace("../modules/redis", {
      async hasPermission(id) { return permissions.has(id); },
      async getUserRank(id) { return id === "mod" ? 10 : 1; },
      async cacheUserPermissions(id) { cachedPermissions.push(id); },
      async cacheUserInfo() {},
      async getBasicUserInfo(id) { return { id, name: id }; },
    });
    replace("../modules/logging", () => ({ error(error) { loggedErrors.push(error); }, warn() {}, info() {} }));
    ["../modules/gameLoadBalancer", "../modules/roleIconCreditUtils", "../modules/fortunePoints", "../modules/skillRating", "../lib/StockMarket", "firebase-admin"].forEach((name) => replace(name, {}));
    reload("../modules/accountLinkage");
    reload("../routes/utils");
    modRouter = reload("../routes/mod");
    userRouter = reload("../routes/user");
  });
  beforeEach(async function () {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
    permissions.clear();
    permissions.add("mod");
    cachedPermissions.length = 0;
    loggedErrors.length = 0;
  });
  after(async function () {
    for (const [filename, saved] of [...previous.entries()].reverse()) {
      if (saved) require.cache[filename] = saved;
      else delete require.cache[filename];
    }
    if (database) await database.close();
  });

  const fp = { platform: "web", stable: "report-device", unstable: "exact" };
  async function fixture() {
    await models.User.create([
      { id: "target", name: "target", ip: ["198.51.100.10"], fingerprints: [fp], deleted: false },
      { id: "ip-alt", name: "ip-alt", ip: ["198.51.100.10"], deleted: false },
      { id: "fp-alt", name: "fp-alt", fingerprints: [fp], deleted: false },
      { id: "partial", name: "partial", fingerprints: [{ ...fp, unstable: "other" }], deleted: false },
    ]);
    await models.Report.create({ id: "case", reporterId: "reporter", reportedUserId: "target", status: "open" });
  }
  async function complete() {
    const res = response();
    await handler(modRouter, "/reports/:id/complete")(request("mod", {
      finalRuling: { banType: "site", rule: violationDefinitions[0].name, offenseNumber: 1, notes: "Fixture decision" },
    }), res);
    assert.equal(res.statusCode, 200, `${String(res.body)}; ${loggedErrors.map((error) => error.stack || String(error)).join("; ")}`);
    return res;
  }

  it("completion records linked bans and tickets for direct IP and exact fingerprint accounts only", async function () {
    await fixture();
    await complete();
    const tickets = await models.ViolationTicket.find({}).lean();
    assert.deepEqual(tickets.map((ticket) => ticket.userId).sort(), ["fp-alt", "ip-alt", "target"]);
    const bans = await models.Ban.find({}).lean();
    assert.deepEqual(bans.map((ban) => ban.userId).sort(), ["fp-alt", "ip-alt", "target"]);
    for (const ticket of tickets) assert.equal(ticket.linkedBanId, bans.find((ban) => ban.userId === ticket.userId).id);
    assert.deepEqual((await models.User.find({ banned: true }).lean()).map((user) => user.id).sort(), ["fp-alt", "ip-alt", "target"]);
  });

  it("reopening reverses the original ticket snapshot after account evidence changes and preserves unrelated bans", async function () {
    await fixture();
    await complete();
    await models.User.updateOne({ id: "fp-alt" }, { $unset: { fingerprints: "" } });
    await models.Ban.create({ id: "unrelated", userId: "partial", type: "chat", auto: false });
    cachedPermissions.length = 0;
    const res = response();
    await handler(modRouter, "/reports/:id/reopen")(request("mod", { newStatus: "open" }), res);
    assert.equal(res.statusCode, 200, String(res.body));
    assert.equal(await models.ViolationTicket.countDocuments({}), 0);
    assert.deepEqual((await models.Ban.find({}).lean()).map((ban) => ban.id), ["unrelated"]);
    assert.equal(await models.User.countDocuments({ banned: true }), 0);
    assert.deepEqual(cachedPermissions.sort(), ["fp-alt", "ip-alt", "target"]);
  });

  it("moderators see fingerprint-linked report history but ordinary users only see their own reports", async function () {
    await fixture();
    await models.Report.updateOne({ id: "case" }, { $set: { status: "complete" } });
    await models.Report.create([
      { id: "ip-report", reportedUserId: "ip-alt", status: "complete" },
      { id: "fp-report", reportedUserId: "fp-alt", status: "complete" },
      { id: "partial-report", reportedUserId: "partial", status: "complete" },
    ]);
    const endpoint = handler(userRouter, "/:id/reports");
    const staff = response();
    await endpoint(request("mod", {}, "target"), staff);
    assert.equal(staff.statusCode, 200, String(staff.body));
    assert.deepEqual(staff.body.reports.map((report) => report.id).sort(), ["case", "fp-report", "ip-report"]);
    assert.deepEqual(staff.body.linkedAccountIds.sort(), ["fp-alt", "ip-alt", "target"]);
    const own = response();
    await endpoint(request("target", {}, "target"), own);
    assert.deepEqual(own.body.reports.map((report) => report.id), ["case"]);
    assert.deepEqual(own.body.linkedAccountIds, ["target"]);
    const denied = response();
    await endpoint(request("partial", {}, "target"), denied);
    assert.equal(denied.statusCode, 403);
  });
});

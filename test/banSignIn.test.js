const assert = require("node:assert/strict");
const http = require("node:http");
const Module = require("node:module");
const express = require("express");
const schemas = require("../db/schemas");
const { createFingerprintMongo } = require("./helpers/fingerprintMongo");
const { banSessionGate } = require("../modules/banSessionGate");

const HOUR = 60 * 60 * 1000;

// A site-banned user who signs in gets the ban page session and nothing else;
// an ended ban signs in normally whatever users.banned says.
describe("Signing in to a site-banned account", function () {
  this.timeout(20000);
  let database, models, handler, discordVerify, periodic, identity;
  const previous = new Map();
  const environment = new Map();
  const fp = { platform: "web", stable: "ban-device", unstable: "exact" };
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

  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    models.SiteActivity = models.User.db.model("SiteActivity", schemas.SiteActivity);
    for (const [name, value] of Object.entries({ NODE_ENV: "test", EMAIL_DOMAINS: '["example.test"]', FIREBASE_JSON_FILE: "ban-signin-firebase-fixture.json", IP_API_IGNORE: "true" })) {
      environment.set(name, process.env[name]);
      process.env[name] = value;
    }
    replace("../db/models", models);
    // Sign-in permission follows the account's running bans, like
    // redis.cacheUserPermissions does.
    replace("../modules/redis", {
      async hasPermission(userId, perm) {
        const now = Date.now();
        return !(await models.Ban.exists({ userId, permissions: perm, $or: [{ expires: 0 }, { expires: { $gt: now } }] }));
      },
      async cacheUserPermissions() {},
    });
    replace("../modules/logging", () => ({ error() {}, warn() {}, info() {} }));
    replace("../modules/userEligibility", { async syncRankedCompetitiveAccess() {} });
    replace("../routes/report", { sendFlaggedUserDiscordAlert() {} });
    replace("../modules/emailAlias", { async findAliasAccount() { return null; }, async findSignupBlockingAccount() { return null; }, plusAliasesStartupWarning() { return null; } });
    replace("firebase-admin", {
      initializeApp() {}, credential: { cert() { return {}; } },
      auth() { return { async verifyIdToken() { return { ...identity, email_verified: true }; } }; },
    });
    replace("passport", { use() {}, serializeUser() {}, deserializeUser() {}, authenticate() { return () => {}; } });
    replace("passport-discord", { Strategy: class { constructor(options, verify) { discordVerify = verify; } } });
    reload("../modules/fingerprintBan");
    reload("../modules/fingerprintLogin");
    reload("../modules/accountLinkage");
    reload("../modules/plotArmor");
    reload("../routes/utils");
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function (name) {
      if (name === "../ban-signin-firebase-fixture.json") return {};
      return originalRequire.apply(this, arguments);
    };
    try {
      const router = reload("../routes/auth");
      handler = router.stack.find((layer) => layer.route && layer.route.path === "/" && layer.route.methods.post).route.stack[0].handle;
    } finally { Module.prototype.require = originalRequire; }
    replace("../routes/utils", { async createNotification() {} });
    replace("../modules/competitive", {});
    periodic = reload("../modules/periodic");
  });
  beforeEach(async function () {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
    identity = { uid: "banned-uid", email: "banned@example.test" };
  });
  after(async function () {
    for (const [filename, saved] of [...previous.entries()].reverse()) {
      if (saved) require.cache[filename] = saved;
      else delete require.cache[filename];
    }
    for (const [name, value] of environment) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    if (database) await database.close();
  });

  async function bannedAccount({ banned = true, expires = Date.now() + HOUR, extra = {} } = {}) {
    await models.User.create({ id: "banned-user", name: "banned", email: [identity.email], fbUid: "banned-uid", deleted: false, banned, ip: ["203.0.113.9"], ...extra });
    if (expires !== null)
      await models.Ban.create({ id: `site-${expires}`, userId: "banned-user", type: "site", expires, permissions: ["signIn", "playGame"], auto: false, reason: "test" });
  }
  async function altAccount(extra = {}) {
    return models.User.create({ id: "alt-user", name: "alt", email: ["alt@example.test"], fbUid: "alt-uid", deleted: false, ip: ["203.0.113.9"], fingerprints: [fp], ...extra });
  }
  async function login(session = {}) {
    const req = { body: { idToken: "valid", fingerprint: fp }, session, headers: { "x-forwarded-for": "198.51.100.30" }, connection: {} };
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, send(value) { this.body = value; return this; }, sendStatus(code) { this.statusCode = code; return this; } };
    await handler(req, res);
    return { req, res };
  }
  // The API as the app mounts it: the gate first, then any route answers.
  async function api(session, method, path) {
    const app = express();
    app.use((req, res, next) => { req.session = session; next(); });
    const apiRouter = express.Router();
    apiRouter.use(banSessionGate);
    apiRouter.all("*", (req, res) => res.send({ reached: req.path }));
    app.use("/api", apiRouter);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method });
      return { status: response.status, body: await response.json() };
    } finally { await new Promise((resolve) => server.close(resolve)); }
  }
  function assertBanSession(req, res) {
    assert.equal(res.statusCode, 403);
    assert.deepEqual(Object.keys(JSON.parse(res.body)).sort(), ["banExpires", "banPage", "siteBanned"]);
    assert.equal(JSON.parse(res.body).banPage, "/banned");
    assert.equal(req.session.user, undefined);
    assert.equal(req.session.siteBan.userId, "banned-user");
    assert.match(req.session.siteBan.csrf, /^[0-9a-f]{48}$/);
  }

  it("gives a banned user the ban page session, which reaches only the ban page APIs", async function () {
    await bannedAccount();
    const { req, res } = await login();
    assertBanSession(req, res);
    for (const [method, path] of [["GET", "/user/info"], ["GET", "/auth/ban"], ["POST", "/auth/ban/appeal"], ["POST", "/auth/ban/logout"], ["POST", "/auth"]]) {
      const { status, body } = await api(req.session, method, path);
      assert.equal(status, 200, `${method} ${path}`);
      assert.equal(body.reached, path);
    }
    // Socket tokens (chat, game), the lobby, games, DMs, everything else.
    for (const [method, path] of [["GET", "/chat/connect"], ["GET", "/game/abc123/connect"], ["GET", "/game/list?list=open"], ["GET", "/chat/channels"], ["POST", "/chat/dm"], ["POST", "/game/host"], ["GET", "/user/banned-user/profile"], ["POST", "/user/info"], ["GET", "/mod/bans"], ["GET", "/roles/all"]]) {
      const { status, body } = await api(req.session, method, path);
      assert.equal(status, 403, `${method} ${path}`);
      assert.deepEqual(body, { siteBanned: true, banPage: "/banned" });
    }
  });

  it("gives the ban page session when users.banned was cleared while a later site ban still runs", async function () {
    await bannedAccount({ banned: false });
    await models.Ban.create({ id: "older", userId: "banned-user", type: "site", expires: Date.now() - HOUR, permissions: ["signIn"], auto: false, reason: "older" });
    const { req, res } = await login();
    assertBanSession(req, res);
  });

  it("gives the ban page session through Discord as well", async function () {
    await bannedAccount({ extra: { discordId: "d-1" } });
    const req = { session: {}, headers: { "x-forwarded-for": "198.51.100.30" }, connection: {} };
    const error = await new Promise((resolve) => discordVerify(req, "at", "rt", { id: "d-1", email: identity.email, username: "banned" }, (err) => resolve(err)));
    assert.equal(error.siteBanned, true);
    assert.equal(req.session.user, undefined);
    assert.equal(req.session.siteBan.userId, "banned-user");
  });

  it("signs in normally once the site ban has ended, even before the cleanup clears users.banned", async function () {
    await bannedAccount({ expires: Date.now() - 1000 });
    const { req, res } = await login({ siteBan: { userId: "banned-user", csrf: "x" } });
    assert.equal(res.statusCode, 200);
    assert.equal(req.session.user.id, "banned-user");
    assert.equal(req.session.siteBan, undefined);
    assert.equal((await models.User.findOne({ id: "banned-user" }).lean()).banned, false);
    assert.equal((await api(req.session, "GET", "/chat/connect")).status, 200);
  });

  it("signs in normally after the cleanup removed the ended ban", async function () {
    await bannedAccount({ banned: false, expires: null });
    const { req, res } = await login();
    assert.equal(res.statusCode, 200);
    assert.equal(req.session.user.id, "banned-user");
  });

  it("still refuses an ended site ban while another ban takes sign-in away", async function () {
    await bannedAccount({ expires: Date.now() - 1000 });
    await models.Ban.create({ id: "perm", userId: "banned-user", type: "bannedUser", expires: 0, permissions: ["signIn"], auto: true });
    const { req, res } = await login();
    assert.equal(res.statusCode, 403);
    assert.equal(req.session.user, undefined);
    assert.equal(req.session.siteBan, undefined);
    assert.equal((await models.User.findOne({ id: "banned-user" }).lean()).banned, true);
  });

  it("leaves an unbanned user unaffected", async function () {
    identity = { uid: "alt-uid", email: "alt@example.test" };
    await altAccount();
    const { req, res } = await login();
    assert.equal(res.statusCode, 200);
    assert.equal(req.session.user.id, "alt-user");
    assert.equal(req.session.siteBan, undefined);
    for (const path of ["/chat/connect", "/game/abc123/connect", "/user/info"])
      assert.equal((await api(req.session, "GET", path)).status, 200);
  });

  it("records the attempt on the banned account only: a linked alt is not banned or given new evidence", async function () {
    await bannedAccount();
    await altAccount();
    const { req, res } = await login();
    assertBanSession(req, res);
    const banned = await models.User.findOne({ id: "banned-user" }).lean();
    assert.deepEqual(banned.ip, ["203.0.113.9", "198.51.100.30"]);
    assert.deepEqual(banned.fingerprints, [fp]);
    const alt = await models.User.findOne({ id: "alt-user" }).lean();
    assert.notEqual(alt.banned, true);
    assert.deepEqual(alt.ip, ["203.0.113.9"]);
    assert.equal(await models.Ban.countDocuments({ userId: "alt-user" }), 0);
    assert.equal(await models.Ban.countDocuments({ userId: "banned-user" }), 1);
  });

  it("still bans a signed-in alt that signs in to the banned account, as before", async function () {
    await bannedAccount();
    await altAccount();
    const { req } = await login({ user: { id: "alt-user" } });
    assert.equal(req.session.user.id, "alt-user");
    assert.equal(req.session.siteBan, undefined);
    assert.equal(await models.Ban.countDocuments({ userId: "alt-user", type: "bannedUser" }), 1);
  });

  it("expireBans keeps users.banned while a later site ban still runs, and clears it after the last", async function () {
    const now = Date.now();
    await models.User.create({ id: "banned-user", name: "banned", email: [identity.email], banned: true });
    await models.Ban.create({ id: "older", userId: "banned-user", type: "site", expires: now - 1000, auto: false });
    await models.Ban.create({ id: "later", userId: "banned-user", type: "site", expires: now + HOUR, auto: false });
    const { expireBans } = periodic.createJobs();
    await expireBans.run();
    assert.equal((await models.User.findOne({ id: "banned-user" }).lean()).banned, true);
    assert.deepEqual((await models.Ban.find({}).lean()).map((ban) => ban.id), ["later"]);
    await models.Ban.updateOne({ id: "later" }, { expires: Date.now() - 1000 });
    await expireBans.run();
    assert.equal((await models.User.findOne({ id: "banned-user" }).lean()).banned, false);
    assert.equal(await models.Ban.countDocuments({}), 0);
  });
});

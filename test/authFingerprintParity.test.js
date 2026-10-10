const assert = require("node:assert/strict");
const Module = require("node:module");
const schemas = require("../db/schemas");
const { createFingerprintMongo } = require("./helpers/fingerprintMongo");

describe("Firebase auth fingerprint evidence parity", function () {
  this.timeout(20000);
  let database, models, handler, identity;
  const previous = new Map();
  const environment = new Map();
  const fp = { platform: "web", stable: "auth-device", unstable: "exact" };
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
    for (const [name, value] of Object.entries({ NODE_ENV: "test", EMAIL_DOMAINS: '["example.test"]', FIREBASE_JSON_FILE: "parity-firebase-fixture.json", IP_API_IGNORE: "true" })) {
      environment.set(name, process.env[name]);
      process.env[name] = value;
    }
    replace("../db/models", models);
    replace("../modules/redis", { async hasPermission() { return true; }, async cacheUserPermissions() {} });
    replace("../modules/logging", () => ({ error() {}, warn() {}, info() {} }));
    replace("../modules/userEligibility", { async syncRankedCompetitiveAccess() {} });
    replace("../routes/report", { sendFlaggedUserDiscordAlert() {} });
    replace("../modules/emailAlias", { async findAliasAccount() { return null; } });
    replace("firebase-admin", {
      initializeApp() {}, credential: { cert() { return {}; } },
      auth() { return { async verifyIdToken(token) {
        if (token === "invalid") throw new Error("Invalid test token");
        return { ...identity, email_verified: token !== "unverified" };
      } }; },
    });
    replace("passport", { use() {}, serializeUser() {}, deserializeUser() {}, authenticate() { return () => {}; } });
    replace("passport-discord", { Strategy: class {} });
    reload("../modules/fingerprintBan");
    reload("../modules/fingerprintLogin");
    reload("../modules/accountLinkage");
    reload("../routes/utils");
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function (name) {
      if (name === "../parity-firebase-fixture.json") return {};
      return originalRequire.apply(this, arguments);
    };
    try {
      const router = reload("../routes/auth");
      handler = router.stack.find((layer) => layer.route && layer.route.path === "/" && layer.route.methods.post).route.stack[0].handle;
    } finally { Module.prototype.require = originalRequire; }
  });
  beforeEach(async function () {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
    identity = { uid: "stored-uid", email: "login@example.test" };
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
  async function account(extra = {}) {
    return models.User.create({ id: "login-user", name: "login", email: [identity.email], fbUid: "stored-uid", deleted: false, ...extra });
  }
  async function login({ token = "valid", fingerprint = fp } = {}) {
    const req = { body: { idToken: token, fingerprint }, session: {}, headers: { "x-forwarded-for": "198.51.100.20" }, connection: {} };
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, send(value) { this.body = value; return this; }, sendStatus(code) { this.statusCode = code; return this; } };
    await handler(req, res);
    return { req, res };
  }

  [false, true].forEach((deleted) => {
    it(`records normalized device evidence for a denied ${deleted ? "deleted banned" : "banned"} login without creating a session`, async function () {
      await account({ banned: true, deleted });
      await models.Ban.create({ id: "site-ban", userId: "login-user", type: "site", expires: 0 });
      const { req, res } = await login({ fingerprint: { platform: " web ", stable: " auth-device ", unstable: " exact " } });
      assert.equal(res.statusCode, 403);
      assert.equal(req.session.user, undefined);
      assert.equal(JSON.parse(res.body).siteBanned, true);
      const user = await models.User.findOne({ id: "login-user" }).lean();
      assert.deepEqual(user.ip, ["198.51.100.20"]);
      assert.deepEqual(user.fingerprints, [fp]);
    });
  });

  it("retains historical prints and de-duplicates successful returning-login prints", async function () {
    const historic = { ...fp, stable: "old-device" };
    await account({ fingerprints: [historic] });
    for (let attempt = 0; attempt < 2; attempt++) {
      const { req, res } = await login();
      assert.equal(res.statusCode, 200);
      assert.equal(req.session.user.id, "login-user");
    }
    assert.deepEqual((await models.User.findOne({ id: "login-user" }).lean()).fingerprints, [historic, fp]);
  });

  it("ignores malformed client-supplied print operators on a denied banned login", async function () {
    await account({ banned: true, fingerprints: [fp] });
    const { req, res } = await login({ fingerprint: { platform: "web", stable: { $regex: ".*" }, unstable: "" } });
    assert.equal(res.statusCode, 403);
    assert.equal(req.session.user, undefined);
    assert.deepEqual((await models.User.findOne({ id: "login-user" }).lean()).fingerprints, [fp]);
  });

  ["invalid", "unverified", "uid-mismatch"].forEach((rejection) => {
    it(`does not record fingerprints or establish a session for ${rejection} authentication`, async function () {
      await account();
      if (rejection === "uid-mismatch") identity.uid = "different-uid";
      const { req, res } = await login({ token: rejection === "uid-mismatch" ? "valid" : rejection });
      assert.equal(res.statusCode, 403);
      assert.equal(req.session.user, undefined);
      assert.deepEqual((await models.User.findOne({ id: "login-user" }).lean()).fingerprints, []);
    });
  });

  it("still blocks exact banned-device signup without creating an account", async function () {
    await models.User.create({ id: "banned", name: "banned", email: ["other@example.test"], banned: true, fingerprints: [fp] });
    const { req, res } = await login();
    assert.equal(res.statusCode, 403);
    assert.deepEqual(JSON.parse(res.body), { signupBlocked: true });
    assert.equal(req.session.user, undefined);
    assert.equal(await models.User.countDocuments({ email: identity.email }), 0);
  });

  it("still restricts rather than hard-blocks a stable-only banned-device signup", async function () {
    await models.User.create({ id: "banned", name: "banned", email: ["other@example.test"], banned: true, fingerprints: [{ ...fp, unstable: "other" }] });
    const { req, res } = await login();
    assert.equal(res.statusCode, 200);
    const user = await models.User.findOne({ email: identity.email }).lean();
    assert.equal(user.flagged, true);
    assert.equal(req.session.user.id, user.id);
    assert.deepEqual(user.fingerprints, [fp]);
    assert.equal(await models.Ban.countDocuments({ userId: user.id, type: "ipFlag" }), 1);
  });
});

const assert = require("node:assert/strict");
const Module = require("node:module");
const schemas = require("../db/schemas");
const { createFingerprintMongo } = require("./helpers/fingerprintMongo");
const { violationDefinitions } = require("../data/violations");

const ENV = "PLOT_ARMOR_USER_IDS";

describe("PLOT_ARMOR_USER_IDS (Plot Armor)", function () {
  const armorPath = require.resolve("../modules/plotArmor");
  let previousArmor, previousEnv;

  function setEnv(value) {
    if (value === undefined) delete process.env[ENV];
    else process.env[ENV] = value;
  }

  function load(value) {
    setEnv(value);
    delete require.cache[armorPath];
    return require("../modules/plotArmor");
  }

  before(function () {
    previousArmor = require.cache[armorPath];
    previousEnv = process.env[ENV];
  });

  after(function () {
    setEnv(previousEnv);
    if (previousArmor) require.cache[armorPath] = previousArmor;
    else delete require.cache[armorPath];
  });

  describe("parsing", function () {
    it("is off when unset, empty, or only spaces and commas", function () {
      for (const value of [undefined, "", "  ", ",", " , ,, "]) {
        const plotArmor = load(value);
        assert.equal(plotArmor.isArmored("laJoqacXr"), false, String(value));
        assert.equal(plotArmor.plotArmorStartupWarning(), null, String(value));
        assert.deepEqual(plotArmor.splitArmored(["a", "laJoqacXr"], "a"), { kept: ["a", "laJoqacXr"], skipped: [] });
      }
    });

    it("trims ids, skips blanks and matches exactly", function () {
      const plotArmor = load(" laJoqacXr , Or7_sztgH,,");
      assert.equal(plotArmor.isArmored("laJoqacXr"), true);
      assert.equal(plotArmor.isArmored("Or7_sztgH"), true);
      assert.equal(plotArmor.isArmored("lajoqacxr"), false);
      assert.equal(plotArmor.isArmored(" laJoqacXr"), false);
      assert.equal(plotArmor.isArmored("someoneElse"), false);
    });

    it("logs one startup warning naming how many accounts are armored", function () {
      assert.match(load("laJoqacXr,Or7_sztgH").plotArmorStartupWarning(), /PLOT_ARMOR_USER_IDS is set: 2 accounts are never banned.*sign-ups sharing their IP or device skip the ban-evasion checks/);
      assert.match(load("laJoqacXr").plotArmorStartupWarning(), /: 1 account is never banned/);
    });

    it("never skips the directly targeted account, and words the log note", function () {
      const plotArmor = load("armored1,armored2");
      assert.deepEqual(plotArmor.splitArmored(["target", "armored1", "alt", "armored2"], "target"), {
        kept: ["target", "alt"],
        skipped: ["armored1", "armored2"],
      });
      assert.deepEqual(plotArmor.splitArmored(["armored1", "armored2"], "armored1"), { kept: ["armored1"], skipped: ["armored2"] });
      assert.equal(plotArmor.plotArmorLogNote([]), null);
      assert.equal(plotArmor.plotArmorLogNote(["a"]), "Plot Armor: skipped 1 linked account");
      assert.equal(plotArmor.plotArmorLogNote(["a", "b"]), "Plot Armor: skipped 2 linked accounts");
    });

    it("uses the same parser as BAN_APPEAL_VOTER_ALLOWLIST", function () {
      const { parseUserIdList } = require("../lib/userIdList");
      assert.equal(parseUserIdList(" , "), null);
      assert.deepEqual([...parseUserIdList(" a , b,,")], ["a", "b"]);
    });
  });

  describe("report ruling and sign-in paths", function () {
    this.timeout(20000);
    let database, models, modRouter, authRouter, identity;
    const previous = new Map();
    const environment = new Map();
    const fp = { platform: "web", stable: "armor-device", unstable: "exact" };

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
    function handler(router, path) {
      return router.stack.find((layer) => layer.route && layer.route.path === path && (path !== "/" || layer.route.methods.post)).route.stack[0].handle;
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

    // Reloads the real routers with the env value set (it is read at load).
    function loadRouters(value) {
      setEnv(value);
      reload("../modules/plotArmor");
      reload("../modules/accountLinkage");
      reload("../modules/fingerprintBan");
      reload("../modules/fingerprintLogin");
      reload("../routes/utils");
      reload("../modules/banAppeals");
      modRouter = reload("../routes/mod");
      const originalRequire = Module.prototype.require;
      Module.prototype.require = function (name) {
        if (name === "../parity-firebase-fixture.json") return {};
        return originalRequire.apply(this, arguments);
      };
      try {
        authRouter = reload("../routes/auth");
      } finally {
        Module.prototype.require = originalRequire;
      }
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
      replace("../modules/redis", {
        async hasPermission() { return true; },
        async getUserRank(id) { return id === "mod" ? 10 : 1; },
        async cacheUserPermissions() {},
        async cacheUserInfo() {},
        async getBasicUserInfo(id) { return { id, name: id }; },
      });
      replace("../modules/logging", () => ({ error() {}, warn() {}, info() {} }));
      ["../modules/gameLoadBalancer", "../modules/roleIconCreditUtils", "../modules/fortunePoints", "../modules/skillRating", "../lib/StockMarket"].forEach((name) => replace(name, {}));
      replace("../modules/userEligibility", { async syncRankedCompetitiveAccess() {} });
      replace("../routes/report", { sendFlaggedUserDiscordAlert() {} });
      replace("../modules/emailAlias", {
        async findAliasAccount() { return null; },
        async findSignupBlockingAccount() { return null; },
        plusAliasesStartupWarning() { return null; },
      });
      replace("firebase-admin", {
        initializeApp() {}, credential: { cert() { return {}; } },
        auth() { return { async verifyIdToken() { return { ...identity, email_verified: true }; } }; },
      });
      replace("passport", { use() {}, serializeUser() {}, deserializeUser() {}, authenticate() { return () => {}; } });
      replace("passport-discord", { Strategy: class {} });
    });

    beforeEach(async function () {
      await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
      identity = { uid: "uid-x", email: "x@example.test" };
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

    async function reportFixture() {
      await models.User.create([
        { id: "target", name: "target", ip: ["198.51.100.10"], fingerprints: [fp], deleted: false },
        { id: "ip-alt", name: "ip-alt", ip: ["198.51.100.10"], deleted: false },
        { id: "fp-alt", name: "fp-alt", fingerprints: [fp], deleted: false },
      ]);
      await models.Report.create({ id: "case", reporterId: "reporter", reportedUserId: "target", status: "open" });
    }

    async function completeReport() {
      const res = response();
      await handler(modRouter, "/reports/:id/complete")({
        session: { user: { id: "mod" } }, params: { id: "case" }, headers: {}, connection: {},
        body: { finalRuling: { banType: "site", rule: violationDefinitions[0].name, offenseNumber: 1, notes: "Fixture decision" } },
      }, res);
      assert.equal(res.statusCode, 200, String(res.body));
    }

    const ids = async (model, filter = {}, field = "userId") => (await model.find(filter).lean()).map((doc) => doc[field]).sort();

    it("unset: the report-ruling cascade bans, tickets and notifies every linked account as before", async function () {
      loadRouters(undefined);
      await reportFixture();
      await completeReport();
      assert.deepEqual(await ids(models.Ban), ["fp-alt", "ip-alt", "target"]);
      assert.deepEqual(await ids(models.ViolationTicket), ["fp-alt", "ip-alt", "target"]);
      assert.deepEqual(await ids(models.User, { banned: true }, "id"), ["fp-alt", "ip-alt", "target"]);
      const action = await models.ModAction.findOne({ name: "Site Ban" }).lean();
      assert.equal(action.args[2], "All linked accounts (3 accounts)");
    });

    it("set: the report-ruling cascade skips armored linked accounts and logs it", async function () {
      loadRouters("ip-alt");
      await reportFixture();
      await models.Session.create({ session: { user: { id: "ip-alt" } } });
      await completeReport();
      assert.deepEqual(await ids(models.Ban), ["fp-alt", "target"]);
      assert.deepEqual(await ids(models.ViolationTicket), ["fp-alt", "target"]);
      assert.deepEqual(await ids(models.User, { banned: true }, "id"), ["fp-alt", "target"]);
      assert.equal(await models.Notification.countDocuments({ user: "ip-alt" }), 0);
      assert.equal(await models.Session.countDocuments({ "session.user.id": "ip-alt" }), 1);
      const action = await models.ModAction.findOne({ name: "Site Ban" }).lean();
      assert.equal(action.args[2], "All linked accounts (2 accounts); Plot Armor: skipped 1 linked account");
    });

    it("set: a report against the armored account itself still bans it", async function () {
      loadRouters("target");
      await reportFixture();
      await completeReport();
      assert.deepEqual(await ids(models.Ban), ["fp-alt", "ip-alt", "target"]);
    });

    async function signInAs(sessionUserId, headers = {}) {
      const req = { body: { idToken: "valid", fingerprint: fp }, session: sessionUserId ? { user: { id: sessionUserId } } : {}, headers: { "x-forwarded-for": "198.51.100.20", ...headers }, connection: {} };
      const res = response();
      await handler(authRouter, "/")(req, res);
      return { req, res };
    }

    async function bannedEmailFixture() {
      await models.User.create([
        { id: "bannedX", name: "bannedX", email: [identity.email], fbUid: "uid-x", banned: true, deleted: false },
        { id: "armored", name: "armored", email: ["armored@example.test"], deleted: false },
      ]);
      await models.Ban.create({ id: "x-ban", userId: "bannedX", type: "site", expires: 0, auto: false });
      await models.Session.create({ session: { user: { id: "armored" } } });
    }

    it("unset: signing in to a banned account's email while signed in bans the signed-in account, as before", async function () {
      loadRouters(undefined);
      await bannedEmailFixture();
      await signInAs("armored");
      assert.equal(await models.Ban.countDocuments({ userId: "armored", type: "bannedUser" }), 1);
      assert.equal((await models.User.findOne({ id: "armored" }).lean()).banned, true);
      assert.equal(await models.Session.countDocuments({ "session.user.id": "armored" }), 0);
    });

    it("set: an armored signed-in account is not banned for it and stays signed in as itself", async function () {
      loadRouters("armored");
      await bannedEmailFixture();
      const { req, res } = await signInAs("armored");
      assert.equal(res.statusCode, 200);
      assert.equal(req.session.user.id, "armored");
      assert.equal(await models.Ban.countDocuments({ userId: "armored" }), 0);
      assert.notEqual((await models.User.findOne({ id: "armored" }).lean()).banned, true);
      assert.equal(await models.Session.countDocuments({ "session.user.id": "armored" }), 1);
    });

    describe("sign-up ban-evasion checks", function () {
      const signupEmail = "new@example.test";
      const requestIp = "198.51.100.20";
      // The banned user each check matches: same IP, exact device, or the same
      // device with a different unstable part (partial match).
      const bannedFor = {
        ip: { ip: [requestIp] },
        exact: { ip: ["192.0.2.1"], fingerprints: [fp] },
        partial: { ip: ["192.0.2.1"], fingerprints: [{ ...fp, unstable: "other" }] },
      };

      async function setup(kind, armoredFields) {
        identity = { uid: "uid-new", email: signupEmail };
        await models.User.create({ id: "bannedZ", name: "bannedZ", email: ["z@example.test"], banned: true, deleted: false, ...bannedFor[kind] });
        await models.User.create({ id: "armored", name: "armored", email: ["armored@example.test"], deleted: false, ...armoredFields });
      }

      async function signUp() {
        const { req, res } = await signInAs(null);
        const user = await models.User.findOne({ email: signupEmail }).lean();
        return { req, res, user };
      }

      async function expectToday(kind) {
        const { req, res, user } = await signUp();
        if (kind === "ip") {
          assert.equal(res.statusCode, 403);
          assert.equal(res.body, "Authentication failed.");
          assert.equal(user, null);
        } else if (kind === "exact") {
          assert.equal(res.statusCode, 403);
          assert.deepEqual(JSON.parse(res.body), { signupBlocked: true });
          assert.equal(user, null);
        } else {
          assert.equal(res.statusCode, 200);
          assert.equal(user.flagged, true);
          assert.equal(req.session.user.id, user.id);
          assert.equal(await models.Ban.countDocuments({ userId: user.id, type: "ipFlag" }), 1);
        }
      }

      async function expectAllowed() {
        const { req, res, user } = await signUp();
        assert.equal(res.statusCode, 200, String(res.body));
        assert.ok(user, "account created");
        assert.equal(req.session.user.id, user.id);
        assert.notEqual(user.flagged, true);
        assert.equal(await models.Ban.countDocuments({ userId: user.id }), 0);
      }

      const sharesIp = { ip: [requestIp] };
      const sharesDevice = { ip: ["203.0.113.50"], fingerprints: [{ ...fp, unstable: "another-browser" }] };
      const sharesNothing = { ip: ["203.0.113.50"], fingerprints: [{ ...fp, stable: "other-device" }] };

      for (const kind of ["ip", "exact", "partial"]) {
        it(`${kind} match, armor unset: behaves as today even next to a would-be armored account`, async function () {
          loadRouters(undefined);
          await setup(kind, sharesIp);
          await expectToday(kind);
        });

        it(`${kind} match, armor set and the sign-up shares an IP with an armored account: allowed and unflagged`, async function () {
          loadRouters("armored");
          await setup(kind, sharesIp);
          await expectAllowed();
        });

        it(`${kind} match, armor set and the sign-up shares a device with an armored account: allowed and unflagged`, async function () {
          loadRouters("armored");
          await setup(kind, sharesDevice);
          await expectAllowed();
        });

        it(`${kind} match, armor set but nothing shared with an armored account: still blocked or flagged`, async function () {
          loadRouters("armored");
          await setup(kind, sharesNothing);
          await expectToday(kind);
        });
      }

      it("an account sharing an IP that is not on the armor list doesn't help", async function () {
        loadRouters("someoneElse");
        await setup("exact", sharesIp);
        await expectToday("exact");
      });
    });

    it("set: an armored account that shares an IP and device with a banned user still signs in", async function () {
      loadRouters("armored");
      identity = { uid: "uid-armored", email: "armored@example.test" };
      await models.User.create([
        { id: "bannedY", name: "bannedY", email: ["y@example.test"], banned: true, ip: ["198.51.100.20"], fingerprints: [fp], deleted: false },
        { id: "armored", name: "armored", email: ["armored@example.test"], fbUid: "uid-armored", ip: ["198.51.100.20"], fingerprints: [fp], deleted: false },
      ]);
      await models.Ban.create({ id: "y-ban", userId: "bannedY", type: "site", expires: 0, auto: false });
      const { req, res } = await signInAs(null);
      assert.equal(res.statusCode, 200, String(res.body));
      assert.equal(req.session.user.id, "armored");
      assert.equal(await models.Ban.countDocuments({ userId: "armored" }), 0);
    });
  });
});

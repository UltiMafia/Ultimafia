const assert = require("node:assert/strict");
const { createFingerprintMongo } = require("./helpers/fingerprintMongo");

describe("routes/user referral account-link parity", function () {
  this.timeout(20000);
  let database, models, handler;
  const saved = new Map();

  function replace(relative, exports) {
    const filename = require.resolve(relative);
    if (!saved.has(filename)) saved.set(filename, require.cache[filename]);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  }

  function reload(relative) {
    const filename = require.resolve(relative);
    if (!saved.has(filename)) saved.set(filename, require.cache[filename]);
    delete require.cache[filename];
    return require(relative);
  }

  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    replace("../db/models", models);
    replace("../modules/redis", {});
    replace("../modules/logging", () => ({ error() {}, warn() {} }));
    replace("../lib/StockMarket", {});
    replace("../modules/skillRating", {});
    reload("../modules/accountLinkage");
    reload("../routes/utils");
    const router = reload("../routes/user");
    handler = router.stack.find((layer) => layer.route && layer.route.path === "/referred").route.stack[0].handle;
  });

  beforeEach(async function () {
    await models.User.deleteMany({}); // Only this suite's isolated random database.
  });

  after(async function () {
    for (const [filename, previous] of [...saved.entries()].reverse()) {
      if (previous) require.cache[filename] = previous;
      else delete require.cache[filename];
    }
    if (database) await database.close();
  });

  async function submit(referrer = "referrer") {
    const req = { session: { user: { id: "referred" } }, body: { referrer } };
    const res = { statusCode: null, sendStatus(code) { this.statusCode = code; return this; } };
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    return models.User.findOne({ id: "referred" }).lean();
  }

  const fingerprint = { platform: "web", stable: "referral-device", unstable: "exact" };

  it("does not attribute a referral to a fingerprint-only linked account", async function () {
    await models.User.create([
      { id: "referred", name: "referred", ip: ["198.51.100.1"], fingerprints: [fingerprint] },
      { id: "referrer", name: "referrer", ip: ["198.51.100.2"], fingerprints: [fingerprint] },
    ]);
    assert.ok(!(await submit()).referrer);
  });

  it("continues rejecting referrals from IP-linked accounts", async function () {
    await models.User.create([
      { id: "referred", name: "referred", ip: ["198.51.100.1"] },
      { id: "referrer", name: "referrer", ip: ["198.51.100.1"] },
    ]);
    assert.ok(!(await submit()).referrer);
  });

  it("permits an unrelated referrer with only a stable fingerprint match", async function () {
    await models.User.create([
      { id: "referred", name: "referred", fingerprints: [fingerprint] },
      { id: "referrer", name: "referrer", fingerprints: [{ ...fingerprint, unstable: "different" }] },
    ]);
    assert.equal((await submit()).referrer, "referrer");
  });

  it("does not replace a previously recorded referral", async function () {
    await models.User.create({ id: "referred", name: "referred", referrer: "original" });
    assert.equal((await submit()).referrer, "original");
  });
});

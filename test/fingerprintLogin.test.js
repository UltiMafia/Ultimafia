const chai = require("chai");
const { createFingerprintMongo, loadWithModels } = require("./helpers/fingerprintMongo");

const should = chai.should();

describe("modules/fingerprintLogin", function () {
  this.timeout(10000);
  let database, models, recordLoginFingerprint, loaded;
  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    loaded = loadWithModels("../../modules/fingerprintLogin", models);
    ({ recordLoginFingerprint } = loaded.loaded);
  });
  after(async function () {
    if (loaded) loaded.restore();
    if (database) await database.close();
  });

  it("records a normalized valid fingerprint for a returning account and ignores malformed login data", async function () {
    await models.User.create({ id: "returning", name: "returning", email: ["returning@example.test"] });
    await recordLoginFingerprint("returning", {
      platform: " web ",
      stable: " stable ",
      unstable: " unstable ",
    });
    await recordLoginFingerprint("returning", { platform: "web", stable: "", unstable: "bad" });

    const user = await models.User.findOne({ id: "returning" }).lean();
    user.fingerprints.should.deep.equal([
      { platform: "web", stable: "stable", unstable: "unstable" },
    ]);
    should.equal(await recordLoginFingerprint("returning", { platform: "web", stable: 4 }), null);
  });
});

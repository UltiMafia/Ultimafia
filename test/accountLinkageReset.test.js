const chai = require("chai");
const { createFingerprintMongo, loadWithModels } = require("./helpers/fingerprintMongo");

const should = chai.should();

describe("modules/accountLinkage reset", function () {
  this.timeout(10000);
  let database, models, clearAllLinkEvidence, loaded;
  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    loaded = loadWithModels("../../modules/accountLinkage", models);
    ({ clearAllLinkEvidence } = loaded.loaded);
  });
  after(async function () {
    if (loaded) loaded.restore();
    if (database) await database.close();
  });

  it("clears IP and fingerprint linkage evidence together", async function () {
    await models.User.create({
      id: "reset-user",
      name: "reset-user",
      ip: ["198.51.100.10"],
      fingerprints: [{ platform: "web", stable: "stable", unstable: "unstable" }],
    });

    await clearAllLinkEvidence();
    const user = await models.User.findOne({ id: "reset-user" }).lean();
    should.equal(user.ip, undefined);
    should.equal(user.fingerprints, undefined);
  });
});

const chai = require("chai");
const { createFingerprintMongo, loadWithModels } = require("./helpers/fingerprintMongo");

const should = chai.should();

describe("modules/accountLinkage account separation", function () {
  this.timeout(10000);
  let database, models, removeSharedLinkEvidence, loaded;
  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    loaded = loadWithModels("../../modules/accountLinkage", models);
    ({ removeSharedLinkEvidence } = loaded.loaded);
  });
  after(async function () {
    if (loaded) loaded.restore();
    if (database) await database.close();
  });

  it("removes only shared IP and exact fingerprint evidence, leaving stable-only history unlinked", async function () {
    await models.User.create([
      {
        id: "one",
        name: "one",
        ip: ["198.51.100.3", "198.51.100.4"],
        fingerprints: [
          { platform: "web", stable: "stable", unstable: "same" },
          { platform: "web", stable: "stable", unstable: "one-only" },
        ],
      },
      {
        id: "two",
        name: "two",
        ip: ["198.51.100.3", "198.51.100.5"],
        fingerprints: [
          { platform: "web", stable: "stable", unstable: "same" },
          { platform: "web", stable: "stable", unstable: "two-only" },
        ],
      },
    ]);

    const removed = await removeSharedLinkEvidence("one", "two");
    removed.should.deep.equal({ ips: ["198.51.100.3"], fingerprintCount: 1 });

    const [one, two] = await Promise.all([
      models.User.findOne({ id: "one" }).lean(),
      models.User.findOne({ id: "two" }).lean(),
    ]);
    one.ip.should.deep.equal(["198.51.100.4"]);
    two.ip.should.deep.equal(["198.51.100.5"]);
    one.fingerprints.should.deep.equal([{ platform: "web", stable: "stable", unstable: "one-only" }]);
    two.fingerprints.should.deep.equal([{ platform: "web", stable: "stable", unstable: "two-only" }]);
  });

  it("removes raw legacy representations that normalize to the shared triple", async function () {
    await models.User.deleteMany({ id: { $in: ["one", "two"] } });
    await models.User.collection.insertMany([
      { id: "one", name: "one", fingerprints: [{ platform: " web ", stable: " stable ", unstable: null }] },
      { id: "two", name: "two", fingerprints: [{ platform: "web", stable: "stable" }] },
    ]);
    (await removeSharedLinkEvidence("one", "two")).should.deep.equal({ ips: [], fingerprintCount: 1 });
    const users = await models.User.find({ id: { $in: ["one", "two"] } }).lean();
    users.forEach((user) => (user.fingerprints || []).should.deep.equal([]));
  });
});

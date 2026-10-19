const chai = require("chai");
const { createFingerprintMongo, loadWithModels } = require("./helpers/fingerprintMongo");

const should = chai.should();

describe("modules/accountLinkage", function () {
  this.timeout(10000);
  let database, models, getDirectLinkedAccountIds, loaded;
  before(async function () {
    database = await createFingerprintMongo();
    models = database.models;
    loaded = loadWithModels("../../modules/accountLinkage", models);
    ({ getDirectLinkedAccountIds } = loaded.loaded);
  });
  after(async function () {
    if (loaded) loaded.restore();
    if (database) await database.close();
  });

  it("matches direct IP and exact same-record fingerprint links without stable-only or transitive expansion", async function () {
    await models.User.create([
      {
        id: "source",
        name: "source",
        ip: ["198.51.100.1"],
        fingerprints: [
          { platform: "web", stable: "stable-a", unstable: "unstable-a" },
          { platform: " ", stable: "ignored", unstable: "ignored" },
        ],
      },
      { id: "ip-alt", name: "ip-alt", ip: ["198.51.100.1"] },
      {
        id: "fingerprint-alt",
        name: "fingerprint-alt",
        fingerprints: [
          { platform: "web", stable: "stable-a", unstable: "unstable-a" },
        ],
      },
      {
        id: "stable-only",
        name: "stable-only",
        fingerprints: [
          { platform: "web", stable: "stable-a", unstable: "other" },
        ],
      },
      {
        id: "cross-record",
        name: "cross-record",
        fingerprints: [
          { platform: "web", stable: "stable-a", unstable: "other" },
          { platform: "web", stable: "other", unstable: "unstable-a" },
        ],
      },
      {
        id: "transitive-only",
        name: "transitive-only",
        ip: ["203.0.113.2"],
        fingerprints: [
          { platform: "web", stable: "stable-b", unstable: "unstable-b" },
        ],
      },
      {
        id: "bridge",
        name: "bridge",
        ip: ["198.51.100.1", "203.0.113.2"],
      },
    ]);
    // Bypass Mongoose casting to exercise malformed legacy stored data.
    await models.User.collection.insertOne({
      id: "malformed",
      name: "malformed",
      fingerprints: [{ platform: "web", stable: "stable-a", unstable: 7 }],
    });

    const ids = await getDirectLinkedAccountIds("source");
    ids.sort().should.deep.equal(["bridge", "fingerprint-alt", "ip-alt", "source"]);
  });

  it("normalizes legacy whitespace, preserves NUL-distinct tuples, and rejects malformed candidates", async function () {
    await models.User.deleteMany({ id: { $in: ["source", "ip-alt", "fingerprint-alt", "stable-only", "cross-record", "transitive-only", "bridge", "malformed"] } });
    await models.User.create({ id: "source", name: "source", fingerprints: [
      { platform: "web\u0000x", stable: "a", unstable: "b\u0000c" },
      { platform: "web", stable: "legacy", unstable: "" },
    ] });
    await models.User.collection.insertMany([
      { id: "legacy", name: "legacy", fingerprints: [{ platform: " web ", stable: " legacy ", unstable: null }] },
      { id: "nul-collision", name: "nul-collision", fingerprints: [{ platform: "web", stable: "x\u0000a", unstable: "b\u0000c" }] },
      { id: "numeric", name: "numeric", fingerprints: [{ platform: "web", stable: "legacy", unstable: 0 }] },
    ]);
    (await getDirectLinkedAccountIds("source")).sort().should.deep.equal(["legacy", "source"]);
  });
});

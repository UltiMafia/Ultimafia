const chai = require("chai");
const should = chai.should();
const {
  normalizeFingerprint,
  classifyFingerprintMatch,
} = require("../modules/fingerprintBan");

describe("modules/fingerprintBan", function () {
  describe("normalizeFingerprint", function () {
    it("rejects null, undefined and non-objects", function () {
      [null, undefined, "web", 1, true, []].forEach((raw) =>
        should.equal(normalizeFingerprint(raw), null)
      );
    });

    it("requires a non-empty string platform and stable", function () {
      [
        {},
        { stable: "s" },
        { platform: "web" },
        { platform: "   ", stable: "s" },
        { platform: "web", stable: "   " },
        { platform: 1, stable: "s" },
        { platform: "web", stable: 1 },
      ].forEach((raw) => should.equal(normalizeFingerprint(raw), null));
    });

    it("caps the length of each field", function () {
      should.equal(
        normalizeFingerprint({ platform: "x".repeat(33), stable: "s" }),
        null
      );
      should.equal(
        normalizeFingerprint({ platform: "web", stable: "x".repeat(129) }),
        null
      );
      should.equal(
        normalizeFingerprint({
          platform: "web",
          stable: "s",
          unstable: "x".repeat(129),
        }),
        null
      );
    });

    it("rejects a non-string unstable value", function () {
      should.equal(
        normalizeFingerprint({ platform: "web", stable: "s", unstable: 7 }),
        null
      );
    });

    it("trims fields and accepts a full triple", function () {
      normalizeFingerprint({
        platform: " web ",
        stable: " s ",
        unstable: " u ",
      }).should.deep.equal({ platform: "web", stable: "s", unstable: "u" });
    });

    it("accepts absent or empty unstable data", function () {
      normalizeFingerprint({ platform: "web", stable: "s" }).should.deep.equal({
        platform: "web",
        stable: "s",
        unstable: "",
      });
      normalizeFingerprint({
        platform: "web",
        stable: "s",
        unstable: "",
      }).unstable.should.equal("");
    });
  });

  describe("classifyFingerprintMatch", function () {
    const fp = { platform: "web", stable: "s", unstable: "u" };

    it("blocks when platform, stable and unstable all match a banned user", function () {
      classifyFingerprintMatch([{ ...fp }], fp).should.equal("block");
      classifyFingerprintMatch(
        [
          { platform: "ios", stable: "z", unstable: "z" },
          { ...fp },
        ],
        fp
      ).should.equal("block");
    });

    it("restricts when only platform and stable match", function () {
      classifyFingerprintMatch([{ ...fp, unstable: "other" }], fp).should.equal(
        "restrict"
      );
    });

    it("treats a missing banned unstable as an empty string", function () {
      classifyFingerprintMatch(
        [{ platform: "web", stable: "s" }],
        { ...fp, unstable: "" }
      ).should.equal("block");
    });

    it("does not match on a different stable", function () {
      should.equal(
        classifyFingerprintMatch([{ ...fp, stable: "other" }], fp),
        null
      );
    });

    it("does not match across platforms even with an identical stable", function () {
      should.equal(
        classifyFingerprintMatch([{ ...fp, platform: "ios" }], fp),
        null
      );
    });

    it("returns null for empty or missing records", function () {
      should.equal(classifyFingerprintMatch([], fp), null);
      should.equal(classifyFingerprintMatch(null, fp), null);
      should.equal(classifyFingerprintMatch(undefined, fp), null);
    });
  });
});

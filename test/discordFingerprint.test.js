const chai = require("chai");
const expect = chai.expect;
const {
  stash,
  take,
  MAX_LENGTH,
} = require("../modules/discordFingerprint");

// The session is the only thing this module touches, so a bare object is a
// faithful stand-in for express-session here.
function fakeRequest() {
  return { session: {} };
}

describe("discord fingerprint carry-through", function () {
  it("stores a fingerprint and consumes it once", function () {
    const req = fakeRequest();
    const fingerprint = { platform: "web", stable: "v2:abc", unstable: "v2:def" };

    expect(stash(req, JSON.stringify(fingerprint))).to.equal(true);
    expect(take(req)).to.deep.equal(fingerprint);
    expect(take(req)).to.equal(null);
    expect(req.session).to.not.have.property("discordFingerprint");
  });

  it("rejects a value that is too long", function () {
    const req = fakeRequest();
    const raw = JSON.stringify({
      platform: "web",
      stable: "x".repeat(MAX_LENGTH),
      unstable: "",
    });

    expect(stash(req, raw)).to.equal(false);
    expect(take(req)).to.equal(null);
  });

  it("rejects invalid JSON", function () {
    const req = fakeRequest();
    expect(stash(req, "{not json")).to.equal(false);
    expect(take(req)).to.equal(null);
  });

  it("rejects values that are not fingerprint-shaped", function () {
    const req = fakeRequest();
    expect(stash(req, JSON.stringify(null))).to.equal(false);
    expect(stash(req, JSON.stringify([1, 2, 3]))).to.equal(false);
    expect(stash(req, JSON.stringify({ platform: "web" }))).to.equal(false);
    expect(stash(req, JSON.stringify({ stable: "v2:abc" }))).to.equal(false);
    expect(take(req)).to.equal(null);
  });

  it("ignores a non-string query value", function () {
    const req = fakeRequest();
    expect(stash(req, ["a", "b"])).to.equal(false);
    expect(take(req)).to.equal(null);
  });

  it("survives a missing session", function () {
    expect(stash({}, JSON.stringify({ platform: "web", stable: "v2:a" }))).to.equal(false);
    expect(take({})).to.equal(null);
  });

  it("leaves an earlier value alone when a later stash is invalid", function () {
    const req = fakeRequest();
    const fingerprint = { platform: "web", stable: "v2:abc", unstable: "" };

    stash(req, JSON.stringify(fingerprint));
    stash(req, "garbage");
    expect(take(req)).to.deep.equal(fingerprint);
  });
});

const fs = require("fs");
const path = require("path");
const chai = require("chai");
const expect = chai.expect;

const {
  TWO_FACTION_MIN,
  TWO_FACTION_MAX,
  clampTwoFactionPayout,
} = require("../shared/fortunePayout");

describe("shared/fortunePayout", function () {
  it("clamps to the two-faction band", function () {
    expect(clampTwoFactionPayout(0)).to.equal(TWO_FACTION_MIN);
    expect(clampTwoFactionPayout(30)).to.equal(TWO_FACTION_MIN);
    expect(clampTwoFactionPayout(60)).to.equal(60);
    expect(clampTwoFactionPayout(96)).to.equal(TWO_FACTION_MAX);
    expect(clampTwoFactionPayout(1000)).to.equal(TWO_FACTION_MAX);
  });

  // The rule only holds if there is one definition of it. The client bundle
  // cannot import from /shared, so react_main/src/shared mirrors this file by
  // hand; fail when someone edits one copy and not the other.
  it("matches the client mirror byte for byte", function () {
    const server = fs.readFileSync(
      path.join(__dirname, "../shared/fortunePayout.js"),
      "utf8"
    );
    const client = fs.readFileSync(
      path.join(__dirname, "../react_main/src/shared/fortunePayout.js"),
      "utf8"
    );
    expect(client).to.equal(server);
  });
});

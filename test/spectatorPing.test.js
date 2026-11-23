const assert = require("node:assert/strict");
const { isSpectatorPing } = require("../react_main/src/shared/spectatorPing");

describe("Spectator cuck ping", function () {
  it("matches only the spectator mention with punctuation and capitalization", function () {
    for (const text of ["@cuck", "@CUCK", "hey @cuck!", "(@cuck)", "@cuck\n@cuck"]) {
      assert.equal(isSpectatorPing(text, true), true, text);
    }
  });
  it("matches @cucks and @cucksection the same way", function () {
    for (const text of ["@cucks", "@CUCKS", "hey @cucks!", "@cucksection", "@CuckSection", "(@cucksection)"]) {
      assert.equal(isSpectatorPing(text, true), true, text);
      assert.equal(isSpectatorPing(text, false), false, text);
    }
  });
  it("rejects substrings, handles and non-text values", function () {
    for (const text of ["cuck", "CUCK", "hey cuck!", "@cuckoo", "scuck", "@cuck-name", "name_@cuck", "é@cuck", "@cuck2", "@@cuck", "cucks", "cucksection", "@cuckss", "@cucks2", "@cucks-name", "@@cucks", "@cucksections", "@cucksection2", "x@cucksection", "", null, undefined, {}]) {
      assert.equal(isSpectatorPing(text, true), false, String(text));
    }
  });
  it("does not infer membership from a truthy value", function () {
    for (const membership of [false, undefined, null, "true", 1]) {
      assert.equal(isSpectatorPing("@cuck", membership), false);
    }
  });
});

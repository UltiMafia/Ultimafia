const assert = require("node:assert/strict");
const csrf = require("../modules/csrf");
const { banSessionGate } = require("../modules/banSessionGate");

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, send() {}, sendStatus(code) { this.statusCode = code; } };
}

describe("comment multipart request middleware gates", function () {
  it("rejects a logged-in multipart POST with missing or incorrect CSRF before its route", function () {
    for (const token of [undefined, "wrong"]) {
      const res = response();
      let reached = false;
      csrf({
        method: "POST", session: { user: { id: "owner", csrf: "right" } },
        headers: { "content-type": "multipart/form-data" },
        get: () => token,
      }, res, () => { reached = true; });
      assert.equal(res.statusCode, 403);
      assert.equal(reached, false);
    }
  });
  it("allows a matching CSRF token and rejects ban-page sessions for both comment routes", function () {
    let reached = false;
    csrf({
      method: "POST", session: { user: { id: "owner", csrf: "right" } },
      get: () => "right",
    }, response(), () => { reached = true; });
    assert.equal(reached, true);
    for (const [method, path] of [["POST", "/comment"], ["GET", "/comment/example/image"]]) {
      reached = false;
      const res = response();
      banSessionGate({ method, path, session: { siteBan: { active: true } } }, res, () => { reached = true; });
      assert.equal(res.statusCode, 403);
      assert.equal(reached, false);
    }
  });
});

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// react_main/src/utils/newspaperPlayers.js is a dependency-free ES module;
// load it without a bundler.
function load() {
  const file = path.join(__dirname, "../../react_main/src/utils/newspaperPlayers.js");
  const src = fs.readFileSync(file, "utf8").replace(/^export /gm, "");
  const ctx = {};
  vm.runInNewContext(`${src}\nthis.out = { newspaperPlayer, obituaryDeath };`, ctx);
  return ctx.out;
}

describe("Newspaper players", function () {
  const { newspaperPlayer, obituaryDeath } = load();

  it("treats a missing avatar flag as no avatar (default noavi)", function () {
    const p = newspaperPlayer({ id: "p1", userId: "u1", name: "Ann" });
    assert.equal(p.avatar, false);
    assert.equal(p.id, "u1");
    assert.equal(p.avatarId, "u1");
  });

  it("keeps uploaded avatars", function () {
    const p = newspaperPlayer({ id: "p1", userId: "u1", name: "Ann", avatar: true });
    assert.equal(p.avatar, true);
    assert.equal(p.avatarId, "u1");
  });

  it("keeps anonymous deck avatars and never exposes the real user", function () {
    const p = newspaperPlayer({ id: "p2", anonId: "deckProfile1", name: "Disguise", avatar: "/decks/deckProfile1.webp" });
    assert.equal(p.avatar, "/decks/deckProfile1.webp");
    assert.equal(p.avatarId, "deckProfile1");
    assert.equal(p.id, "p2");
  });

  it("anonymous deck profile without a picture falls back to no avatar", function () {
    assert.equal(newspaperPlayer({ id: "p3", anonId: "d2", name: "X", avatar: "" }).avatar, false);
  });

  it("gives every obituary in a paper a unique key, even in anonymous games", function () {
    const snippets = { deathMessage: "x died", revealMessage: "", lastWill: "" };
    const deaths = [
      { id: "p1", playerInfo: { id: "p1", anonId: "d1", name: "A", avatar: "/decks/d1.webp" }, snippets },
      { id: "p2", playerInfo: { id: "p2", anonId: "d2", name: "B" }, snippets },
    ].map(obituaryDeath);
    assert.deepEqual(deaths.map((d) => d.key), ["p1", "p2"]);
    assert.equal(deaths[1].avatar, false);
    assert.equal(deaths[0].deathMessage, "x died");
  });
});

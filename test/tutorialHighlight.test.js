const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

// Load the client resolver (ES module syntax) without a bundler.
const src = fs
  .readFileSync(path.join(__dirname, "../react_main/src/lib/tutorialHighlight.js"), "utf8")
  .replace(/export (const|function) /g, "$1 ");
const { resolveHighlights } = new Function(src + "\nreturn { resolveHighlights };")();

// Tiny fake DOM: a map of selectors to elements; hidden elements have no
// client rects, as a closed panel on a phone-width layout does.
function el(name, shown = true, text = "") {
  return { name, textContent: text, getClientRects: () => (shown ? [{}] : []) };
}
function doc(map) {
  return {
    querySelector: (s) => (map[s] || [])[0] || null,
    querySelectorAll: (s) => map[s] || [],
  };
}

describe("Tutorial highlight resolver", function () {
  const item = [{ meeting: "Investigate", target: "Silas" }];

  it("desktop: lights the meeting box, the player row and the dropdown option", function () {
    const box = el("box"), row = el("row"), opt = el("opt", true, " Silas "), other = el("o2", true, "Mira");
    const d = doc({
      '[data-meeting-name="Investigate"]': [box],
      '[data-tutorial="player-list"] [data-player-name="Silas"]': [row],
      ".MuiMenuItem-root": [opt, other],
      '[data-tutorial="actions-tab"]': [el("tab", false)],
    });
    expect(resolveHighlights(item, d).map((e) => e.name)).to.deep.equal(["box", "row", "opt"]);
  });

  it("phone width: highlights the Actions tab first, then the meeting once it is open", function () {
    const tab = el("tab");
    const closed = doc({
      '[data-meeting-name="Investigate"]': [el("box", false)],
      '[data-tutorial="player-list"] [data-player-name="Silas"]': [el("row", false)],
      '[data-tutorial="actions-tab"]': [tab],
    });
    expect(resolveHighlights(item, closed).map((e) => e.name)).to.deep.equal(["tab"]);
    const open = doc({
      '[data-meeting-name="Investigate"]': [el("box")],
      '[data-tutorial="player-list"] [data-player-name="Silas"]': [el("row", false)],
      '[data-tutorial="actions-tab"]': [tab],
    });
    expect(resolveHighlights(item, open).map((e) => e.name)).to.deep.equal(["box"]);
  });

  it("walkthrough and chat targets", function () {
    const d = doc({
      '[data-tutorial="player-list"]': [el("list", false)],
      '[data-tutorial="players-tab"]': [el("ptab")],
      '[data-tutorial="chat-input"]': [el("chat")],
      "[data-meeting-name]": [el("m1"), el("m2", false)],
    });
    expect(resolveHighlights([{ ui: "players" }, { chat: true }, { ui: "actions" }], d).map((e) => e.name)).to.deep.equal([
      "ptab",
      "chat",
      "m1",
    ]);
  });
});

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
function el(name, shown = true, text = "", attrs = {}) {
  return {
    name,
    textContent: text,
    getClientRects: () => (shown ? [{}] : []),
    getAttribute: (a) => (a in attrs ? attrs[a] : null),
  };
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

  it("item meetings (the Sheriff's gun): lights the Inventory cell, then the Shoot Gun box once it's open", function () {
    const gun = el("gun", true, "", { "data-item-meetings": "Shoot Gun" });
    const other = el("other", true, "", { "data-item-meetings": "Village Thing" });
    const shoot = [{ meeting: "Shoot Gun", target: "sure" }];
    const closed = doc({
      '[data-meeting-name="Shoot Gun"]': [],
      "[data-item-meetings]": [other, gun],
      '[data-tutorial="inventory-header"]': [el("inv")],
      '[data-tutorial="actions-tab"]': [el("tab", false)],
    });
    expect(resolveHighlights(shoot, closed).map((e) => e.name)).to.deep.equal(["gun"]);
    const open = doc({
      '[data-meeting-name="Shoot Gun"]': [el("box")],
      "[data-item-meetings]": [gun],
      ".MuiMenuItem-root": [el("opt", true, "sure")],
    });
    expect(resolveHighlights(shoot, open).map((e) => e.name)).to.deep.equal(["box", "opt"]);
  });

  it("item meetings: a collapsed Inventory lights its header; on a phone the Actions tab", function () {
    const shoot = [{ meeting: "Shoot Gun", target: "sure" }];
    const collapsed = doc({
      "[data-item-meetings]": [el("gun", false, "", { "data-item-meetings": "Shoot Gun" })],
      '[data-tutorial="inventory-header"]': [el("inv")],
      '[data-tutorial="actions-tab"]': [el("tab", false)],
    });
    expect(resolveHighlights(shoot, collapsed).map((e) => e.name)).to.deep.equal(["inv"]);
    const phone = doc({
      "[data-item-meetings]": [el("gun", false, "", { "data-item-meetings": "Shoot Gun" })],
      '[data-tutorial="inventory-header"]': [el("inv", false)],
      '[data-tutorial="actions-tab"]': [el("tab")],
    });
    expect(resolveHighlights(shoot, phone).map((e) => e.name)).to.deep.equal(["tab"]);
  });

  it("phone: a chat step lights the Chat tab while another tab is open", function () {
    const d = doc({
      '[data-tutorial="chat-input"]': [el("chat", false)],
      '[data-tutorial="chat-tab"]': [el("ctab")],
    });
    expect(resolveHighlights([{ chat: true }], d).map((e) => e.name)).to.deep.equal(["ctab"]);
    expect(resolveHighlights([{ ui: "chat" }], d).map((e) => e.name)).to.deep.equal(["ctab"]);
  });

  it("uses the on-screen copy when the hidden layout has the same element", function () {
    const d = doc({
      '[data-meeting-name="Village"]': [el("desktopBox", false), el("phoneBox")],
      '[data-tutorial="chat-input"]': [el("desktopChat", false), el("phoneChat")],
    });
    expect(resolveHighlights([{ meeting: "Village" }, { chat: true }], d).map((e) => e.name)).to.deep.equal([
      "phoneBox",
      "phoneChat",
    ]);
  });

  it("a phase with nothing to do or say lights the Actions panel and the chat on a computer", function () {
    const d = doc({
      "[data-meeting-name]": [],
      '[data-tutorial="actions-panel"]': [el("apanel")],
      '[data-tutorial="actions-tab"]': [el("atab", false)],
      '[data-tutorial="chat-input"]': [],
      '[data-tutorial="chat-panel"]': [el("cpanel")],
      '[data-tutorial="chat-tab"]': [el("ctab", false)],
    });
    expect(resolveHighlights([{ ui: "actions" }, { ui: "chat" }], d).map((e) => e.name)).to.deep.equal(["apanel", "cpanel"]);
  });
});

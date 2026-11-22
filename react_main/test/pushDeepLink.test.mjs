import test from "node:test";
import assert from "node:assert/strict";
import {
  PUSH_DEEP_LINK_PANEL_PARAM,
  pushDeepLinkPanel,
  pushDeepLinkPanelFromMessage,
} from "../src/pages/Game/pushDeepLink.js";

test("reads the panel a notification asked for", () => {
  assert.equal(PUSH_DEEP_LINK_PANEL_PARAM, "panel");
  assert.equal(pushDeepLinkPanel("?panel=actions"), "actions");
  assert.equal(pushDeepLinkPanel("?spectate=true&panel=actions"), "actions");
});

test("accepts every panel the phone layout can show", () => {
  for (const panel of ["chat", "players", "actions", "info", "menu"]) {
    assert.equal(pushDeepLinkPanel(`?panel=${panel}`), panel);
  }
});

test("ignores a panel it does not know, rather than selecting nothing", () => {
  assert.equal(pushDeepLinkPanel("?panel=kudos"), null);
  assert.equal(pushDeepLinkPanel("?panel="), null);
});

test("no panel request is not an error", () => {
  assert.equal(pushDeepLinkPanel(""), null);
  assert.equal(pushDeepLinkPanel("?spectate=true"), null);
  assert.equal(pushDeepLinkPanel(undefined), null);
  assert.equal(pushDeepLinkPanel(null), null);
});

test("honours a worker message only for the game it is about", () => {
  const message = {
    type: "push-deep-link",
    kind: "kicks-reminder",
    gameId: "abc123",
    panel: "actions",
  };

  assert.equal(pushDeepLinkPanelFromMessage(message, "abc123"), "actions");
  assert.equal(pushDeepLinkPanelFromMessage(message, "other"), null);
  assert.equal(pushDeepLinkPanelFromMessage(message, undefined), null);
});

test("ignores unrelated worker messages and unknown panels", () => {
  assert.equal(
    pushDeepLinkPanelFromMessage({ type: "other", gameId: "abc", panel: "actions" }, "abc"),
    null
  );
  assert.equal(pushDeepLinkPanelFromMessage({ gameId: "abc", panel: "actions" }, "abc"), null);
  assert.equal(
    pushDeepLinkPanelFromMessage({ type: "push-deep-link", gameId: "abc", panel: "nope" }, "abc"),
    null
  );
  assert.equal(pushDeepLinkPanelFromMessage(null, "abc"), null);
});

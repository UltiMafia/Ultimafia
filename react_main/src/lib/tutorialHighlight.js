// Finds the real game UI elements a tutorial step points at, so the
// tutorial box never needs its own action buttons. Items come from the
// server: { meeting, target } (a meeting box and the player to pick),
// { chat: true } (the chat input) or { ui: "players" | "actions" | "chat" }.
// On a phone, when the part isn't on screen, the bottom tab that opens it is
// highlighted first; once that panel is open the real element lights up.

export const HIGHLIGHT_CLASS = "tutorial-highlight";

function visible(el) {
  return !!el && el.getClientRects().length > 0;
}

function first(doc, selector) {
  return doc.querySelector(selector);
}

function attr(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}

export function resolveHighlights(items, doc) {
  const out = [];
  const add = (el) => el && !out.includes(el) && out.push(el);
  const orTab = (el, tab) => {
    if (visible(el)) add(el);
    else add(first(doc, `[data-tutorial="${tab}-tab"]`));
  };

  for (const h of items || []) {
    if (!h) continue;
    if (h.ui === "players") orTab(first(doc, '[data-tutorial="player-list"]'), "players");
    else if (h.ui === "actions") {
      const boxes = Array.from(doc.querySelectorAll("[data-meeting-name]")).filter(visible);
      if (boxes.length) boxes.forEach(add);
      else add(first(doc, '[data-tutorial="actions-tab"]'));
    } else if (h.ui === "chat" || h.chat) {
      const input = first(doc, '[data-tutorial="chat-input"]');
      if (visible(input)) add(input);
    } else if (h.meeting) {
      const box = first(doc, `[data-meeting-name="${attr(h.meeting)}"]`);
      if (!visible(box)) {
        add(first(doc, '[data-tutorial="actions-tab"]'));
        continue;
      }
      add(box);
      if (!h.target) continue;
      const row = first(doc, `[data-tutorial="player-list"] [data-player-name="${attr(h.target)}"]`);
      if (visible(row)) add(row);
      // The open dropdown of that meeting lists the target as a menu item.
      for (const item of Array.from(doc.querySelectorAll(".MuiMenuItem-root")))
        if (item.textContent.trim() === h.target) add(item);
    }
  }
  return out;
}

export const HIGHLIGHT_CSS = `
@keyframes tutorialPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(255, 196, 0, 0.95); }
  50% { box-shadow: 0 0 0 5px rgba(255, 196, 0, 0.35); }
}
.${HIGHLIGHT_CLASS} {
  animation: tutorialPulse 1.4s ease-in-out infinite;
  border-radius: 6px;
  position: relative;
  z-index: 1;
}
`;

// Finds the real game UI elements a tutorial step points at, so the
// tutorial box never needs its own action buttons. Items come from the
// server: { meeting, target } (a meeting box and the player to pick),
// { chat: true } (the chat input) or { ui: "players" | "actions" | "chat" }.
// On a phone, when the part isn't on screen, the bottom tab that opens it is
// highlighted first; once that panel is open the real element lights up.
// A meeting that belongs to an item (the Sheriff's Shoot Gun) lives in a
// popover on that item's Inventory cell: the cell lights up until it's open.

export const HIGHLIGHT_CLASS = "tutorial-highlight";

function visible(el) {
  if (!el || el.getClientRects().length === 0) return false;
  // Inside a collapsed accordion (e.g. a closed Inventory) it isn't on screen.
  return !(el.closest && el.closest(".MuiCollapse-hidden"));
}

// The desktop and phone layouts are both in the page (one hidden), so prefer
// the copy that is on screen.
function pick(els) {
  return els.find(visible) || els[0] || null;
}

function first(doc, selector) {
  return pick(Array.from(doc.querySelectorAll(selector)));
}

function itemCell(doc, meeting) {
  return pick(
    Array.from(doc.querySelectorAll("[data-item-meetings]")).filter((el) =>
      String(el.getAttribute("data-item-meetings")).split("|").includes(meeting)
    )
  );
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
      const panel = first(doc, '[data-tutorial="actions-panel"]');
      if (boxes.length) boxes.forEach(add);
      // Nothing to do this phase (e.g. the Sheriff at night): the panel itself.
      else if (visible(panel)) add(panel);
      else add(first(doc, '[data-tutorial="actions-tab"]'));
    } else if (h.ui === "chat" || h.chat) {
      const input = first(doc, '[data-tutorial="chat-input"]');
      const panel = first(doc, '[data-tutorial="chat-panel"]');
      if (visible(input)) add(input);
      // No chat box (town can't talk at night): the chat itself.
      else if (visible(panel)) add(panel);
      else add(first(doc, '[data-tutorial="chat-tab"]'));
    } else if (h.meeting) {
      const box = first(doc, `[data-meeting-name="${attr(h.meeting)}"]`);
      if (!visible(box)) {
        const cell = itemCell(doc, h.meeting);
        const header = cell && first(doc, '[data-tutorial="inventory-header"]');
        if (visible(cell)) add(cell);
        else if (visible(header)) add(header);
        else add(first(doc, '[data-tutorial="actions-tab"]'));
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
body.tutorial-open [data-tutorial-pad] {
  padding-bottom: 50vh;
}
.${HIGHLIGHT_CLASS} {
  animation: tutorialPulse 1.4s ease-in-out infinite;
  border-radius: 6px;
  position: relative;
  z-index: 1;
}
`;

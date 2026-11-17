// In-page extraction of the control and heading treatments a route actually
// renders. The family pass answers "does this page have the same parts"; this
// pass answers "does this control role look the same wherever it appears".
//
// A control role (segmented filter, page vote, pagination) must have one
// implementation. Any hand-built group without data-ui-control is reported,
// because that is how a second treatment gets introduced.
function controlSignature() {
  const main = document.querySelector("#main-content");
  if (!main) return { controls: [], headings: [], origin: null };

  const round = (value) => Math.round(parseFloat(value) * 10) / 10;
  const text = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 64);
  const box = (el) => el.getBoundingClientRect();
  const style = (el) => getComputedStyle(el);
  const isRendered = (el) => box(el).width > 0 && box(el).height > 0;

  function describe(el) {
    const group = style(el);
    const items = [...el.querySelectorAll("button, [role=tab], a.ui-action, .ui-action")].filter(isRendered);
    const isSelected = (entry) =>
      entry.getAttribute("aria-pressed") === "true" ||
      entry.getAttribute("aria-selected") === "true" ||
      entry.classList.contains("is-selected") ||
      entry.classList.contains("Mui-selected");
    // Describe an ordinary option, not whichever one happens to be first:
    // selected and disabled items legitimately change colour.
    const first = items.find((entry) => !isSelected(entry) && !entry.disabled) || items.find((entry) => !isSelected(entry)) || items[0] || null;
    const item = first ? style(first) : null;
    const selected = items.find(isSelected);
    const selectedStyle = selected ? style(selected) : null;
    const groupBox = box(el);
    const itemBox = first ? box(first) : null;
    return {
      kind: el.getAttribute("data-ui-control"),
      variant: el.getAttribute("data-ui-variant") || "default",
      label: text(el),
      itemCount: items.length,
      inPageHeader: Boolean(el.closest("[data-ui-page-header]")),
      group: {
        display: group.display,
        height: Math.round(groupBox.height),
        radius: round(group.borderTopLeftRadius),
        paddingX: round(group.paddingLeft),
        background: group.backgroundColor,
        borderWidth: round(group.borderTopWidth),
        borderColor: group.borderTopColor,
      },
      item: item && itemBox ? {
        height: Math.round(itemBox.height),
        paddingX: round(item.paddingLeft),
        fontSize: round(item.fontSize),
        fontWeight: String(item.fontWeight),
        radius: round(item.borderTopLeftRadius),
        borderWidth: round(item.borderTopWidth),
        color: item.color,
      } : null,
      selected: selectedStyle ? {
        background: selectedStyle.backgroundColor,
        color: selectedStyle.color,
        borderWidth: round(selectedStyle.borderTopWidth),
      } : null,
    };
  }

  const controls = [];
  const described = new Set();
  function add(el, registered) {
    if (described.has(el)) return;
    described.add(el);
    controls.push({ registered, tag: el.tagName.toLowerCase(), ...describe(el) });
  }

  for (const el of main.querySelectorAll("[data-ui-control]")) add(el, true);

  // Hand-built groups. MUI nested groups repeat role=group on the wrapper, so
  // skip an element that sits inside another reported group.
  const candidates = main.querySelectorAll(
    '.MuiToggleButtonGroup-root, [role="group"][aria-label], [role="tablist"]',
  );
  for (const el of candidates) {
    if (el.closest("[data-ui-control]")) continue;
    if (el.parentElement?.closest('.MuiToggleButtonGroup-root, [role="group"][aria-label], [role="tablist"]')) continue;
    add(el, false);
  }

  // A row of pressed-state buttons is a segmented choice even without an ARIA
  // group. This is how the setup Statistics game-type filter was built.
  for (const el of main.querySelectorAll("div, ul, section")) {
    if (el.closest("[data-ui-control]")) continue;
    const children = [...el.children];
    if (children.length < 2) continue;
    if (!children.every((child) => child.matches("button, .ui-action") && child.hasAttribute("aria-pressed"))) continue;
    add(el, false);
  }

  // A heading is any h1-h6 plus visually heading-sized bold text that is not a
  // heading element. The second set is how "Fanart" and similar drift in.
  const headingNodes = [...main.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(isRendered);
  // A section label, not a stat value: block-level, starts its container,
  // contains words, and is not inside a control or a stat tile.
  const pseudoNodes = [...main.querySelectorAll("p, div")].filter((el) => {
    if (headingNodes.includes(el) || el.children.length || !isRendered(el)) return false;
    const value = (el.textContent || "").trim();
    if (!value || value.length > 70 || !/[a-z]/i.test(value)) return false;
    if (el.previousElementSibling) return false;
    if (el.closest("button, a, .ui-action, [role=button], label, [data-ui-page-header], .ui-stat, .ui-stat-row")) return false;
    const computed = style(el);
    return parseInt(computed.fontWeight, 10) >= 600 && parseFloat(computed.fontSize) >= 17;
  });

  function originFor(el) {
    const container = el.closest(".ui-section, .ui-card, [data-ui-panel]");
    if (!container) return null;
    const computed = style(container);
    return box(container).left + parseFloat(computed.paddingLeft) + parseFloat(computed.borderLeftWidth);
  }

  const headings = [...headingNodes, ...pseudoNodes].map((el) => {
    const computed = style(el);
    const isHeadingElement = /^h[1-6]$/i.test(el.tagName);
    const origin = originFor(el);
    const left = box(el).left + parseFloat(computed.paddingLeft);
    return {
      level: isHeadingElement ? Number(el.tagName[1]) : 0,
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 64),
      fontSize: round(computed.fontSize),
      fontWeight: String(computed.fontWeight),
      offset: origin == null ? null : round(left - origin),
      origin: origin == null ? null : Math.round(origin),
      // A section heading either owns the shared heading wrapper or is the
      // direct child of its surface. A title inside a grid column is aligned
      // to that column, not to the section behind it.
      startsSection: !el.previousElementSibling &&
        !el.closest("button, a, .ui-action, [role=button], [data-ui-page-header]") &&
        (Boolean(el.closest(".ui-section-heading")) ||
          el.parentElement === el.closest(".ui-section, .ui-card, [data-ui-panel]")),
      left: Math.round(left),
      container: el.closest(".ui-section, .ui-card, [data-ui-panel]")?.className || null,
    };
  });

  return {
    origin: Math.round(box(main).left + parseFloat(style(main).paddingLeft)),
    controls,
    headings,
  };
}

module.exports = { controlSignature };

// Runs inside the Playwright page. Reads the topmost open overlay and returns a
// structural signature. Menus, popovers, drawers and dialogs are measured with
// the same vocabulary so they can be compared.
function dialogSignature() {
  const visible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
  };
  const round = (value) => (Number.isFinite(value) ? Math.round(value * 100) / 100 : null);
  const number = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const radiusOf = (style) => {
    const value = number(style.borderTopLeftRadius);
    return value !== null && value > 64 ? 999 : value;
  };
  const textOf = (element) => (element?.innerText || "").replace(/\s+/g, " ").trim();

  const papers = [
    ...document.querySelectorAll(
      "[role='dialog'], .MuiDialog-paper, .MuiPopover-paper, .MuiMenu-paper, .MuiDrawer-paper, .sheet-paper, .ui-sheet",
    ),
  ].filter(visible);
  if (!papers.length) return null;
  const root = papers[papers.length - 1];
  const host = root.closest(".MuiDialog-root, .MuiPopover-root, .MuiMenu-root, .MuiDrawer-root") || root;
  const style = getComputedStyle(root);
  const box = root.getBoundingClientRect();

  const kind = root.closest(".MuiMenu-root") ? "menu"
    : root.closest(".MuiPopover-root") ? "popover"
      : root.closest(".MuiDrawer-root") ? "drawer"
        : root.closest(".ui-sheet, .sheet-paper") ? "sheet"
          : "dialog";

  const titleElement = root.querySelector(
    ".ui-dialog-title, .MuiDialogTitle-root, [id$='-title'], h1, h2, h3, h4",
  );
  const titleStyle = titleElement ? getComputedStyle(titleElement) : null;

  const content = root.querySelector(".ui-dialog-content, .MuiDialogContent-root, .MuiDialogContent-root, [role='document']");
  const actions = root.querySelector(".ui-dialog-actions, .MuiDialogActions-root");
  // Helper text is auxiliary field copy, not the dialog's body paragraph.
  const paragraphs = [...root.querySelectorAll("p, li, .ui-dialog-description")]
    .filter(visible)
    .filter((element) => !element.closest(".MuiFormHelperText-root"));
  const bodyStyle = paragraphs[0] ? getComputedStyle(paragraphs[0]) : null;

  const buttons = [...root.querySelectorAll("button, a.ui-action, .MuiButton-root")].filter(visible).map((button) => {
    const buttonStyle = getComputedStyle(button);
    const buttonBox = button.getBoundingClientRect();
    return {
      label: textOf(button).slice(0, 40) || button.getAttribute("aria-label") || "",
      height: round(buttonBox.height),
      width: round(buttonBox.width),
      radius: round(number(buttonStyle.borderTopLeftRadius)),
      fontSize: round(number(buttonStyle.fontSize)),
      iconOnly: textOf(button).length === 0,
    };
  });

  // Only the action region is the comparable action row. Editor toolbars,
  // switches and other content controls have their own control heights.
  const actionHeights = actions
    ? [...new Set(
        [...actions.querySelectorAll("button, a.ui-action, .MuiButton-root")]
          .filter(visible)
          .map((button) => round(button.getBoundingClientRect().height))
          .filter((height) => height > 0),
      )]
    : [];

  const overflow = [];
  for (const element of root.querySelectorAll("*")) {
    if (!visible(element) || element.closest("svg, canvas")) continue;
    if (element.scrollWidth - element.clientWidth <= 4) continue;
    const elementStyle = getComputedStyle(element);
    if (!["visible", "hidden"].includes(elementStyle.overflowX)) continue;
    if (!textOf(element) && !element.matches("input, select, textarea, img, table")) continue;
    overflow.push({
      selector: `${element.tagName.toLowerCase()}${element.className && typeof element.className === "string" ? "." + element.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`,
      excess: element.scrollWidth - element.clientWidth,
    });
    if (overflow.length >= 5) break;
  }

  const closeControl = [...root.querySelectorAll("button, a.ui-action")].find(
    (element) => /close|cancel|dismiss/i.test(element.getAttribute("aria-label") || textOf(element)),
  );

  return {
    kind,
    box: { width: round(box.width), height: round(box.height) },
    radius: round(radiusOf(style)),
    paddingTop: round(number(style.paddingTop)),
    paddingLeft: round(number(style.paddingLeft)),
    maxWidth: style.maxWidth,
    hasTitle: Boolean(titleElement),
    title: titleElement ? textOf(titleElement).slice(0, 60) : null,
    titleFontSize: titleStyle ? round(number(titleStyle.fontSize)) : null,
    titleFontWeight: titleStyle ? titleStyle.fontWeight : null,
    hasContent: Boolean(content),
    hasActions: Boolean(actions),
    hasClose: Boolean(closeControl),
    fieldCount: root.querySelectorAll("input, select, textarea").length,
    menuRows: root.querySelectorAll("[role='menuitem'], .MuiMenuItem-root").length,
    bodyFontSize: bodyStyle ? round(number(bodyStyle.fontSize)) : null,
    buttons,
    actionHeights,
    overflow,
    text: textOf(root).slice(0, 120),
  };
}

module.exports = { dialogSignature };

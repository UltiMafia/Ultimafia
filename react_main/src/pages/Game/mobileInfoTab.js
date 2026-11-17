// Layout for the body of the mobile game Info tab.
//
// Setup facts and guides share one scrolling viewport below the phase/menu
// toolbar. No separate setup flex child may consume the space above that bar.
export function mobileInfoTabSx(selectedPanel) {
  return {
    display: selectedPanel === "info" ? "flex" : "none",
    flex: "1",
    minHeight: 0,
    flexDirection: "column",
    overflowY: "auto",
    overflowX: "hidden",
  };
}

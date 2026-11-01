// Layout for the body of the mobile game Info tab.
//
// It has to be a flex column that clips its own overflow: the guide list inside
// it is a filling child (`flex: 1; minHeight: 0; overflowY: auto`), and in a
// non-flex box that child simply grows to its content height, so the list looks
// cut off at the bottom and cannot be scrolled.
export function mobileInfoTabSx(selectedPanel) {
  return {
    display: selectedPanel === "info" ? "flex" : "none",
    flex: "1",
    minHeight: 0,
    flexDirection: "column",
    overflow: "hidden",
  };
}

import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Tabs } from "@mui/material";
import { selectedTabScrollDelta } from "./tabGeometry";

// MUI's auto arrows may temporarily disappear between its two intersection
// callbacks. The browser clamps the scroll offset to that wider strip; when the
// arrows return, MUI doesn't revisit a selected tab whose indicator didn't move.
// Recheck selection after strip resizing without intercepting arrow scrolling.
const UiTabs = forwardRef(function UiTabs({ value, orientation = "horizontal", ...props }, ref) {
  const root = useRef(null);
  useImperativeHandle(ref, () => root.current);
  useLayoutEffect(() => {
    const scroller = root.current?.querySelector(".MuiTabs-scroller");
    if (!scroller) return;
    let frame;
    const keepSelectedVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const focused = scroller.ownerDocument.activeElement;
        const selected = focused?.getAttribute('role') === 'tab' && scroller.contains(focused)
          ? focused : scroller.querySelector('[role="tab"][aria-selected="true"]');
        if (!selected) return;
        const bounds = scroller.getBoundingClientRect(), tab = selected.getBoundingClientRect();
        const vertical = orientation === "vertical";
        const delta = vertical
          ? selectedTabScrollDelta(bounds.top, bounds.bottom, tab.top, tab.bottom)
          : selectedTabScrollDelta(bounds.left, bounds.right, tab.left, tab.right);
        if (Math.abs(delta) > 0.5) {
          if (vertical) scroller.scrollTop += delta;
          else scroller.scrollLeft += delta;
        }
      });
    };
    const observer = new ResizeObserver(keepSelectedVisible);
    observer.observe(scroller);
    // The auto arrows are children of the scroller, not of the Tabs root. Observe
    // the scroller subtree so a tab strip that widens or narrows when the arrows
    // appear or disappear rechecks the selected tab's visibility.
    const mutations = new MutationObserver(keepSelectedVisible);
    mutations.observe(scroller, { childList: true, subtree: true });
    keepSelectedVisible();
    return () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame); };
  }, [value, orientation]);
  return <Tabs {...props} value={value} orientation={orientation} ref={root} />;
});

export default UiTabs;

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
    // The strip narrows when MUI's auto arrows appear, which can land the first
    // scroll short. Retry until the strip stops moving.
    const keepSelectedVisible = () => {
      cancelAnimationFrame(frame);
      let attempts = 0;
      const step = () => {
        const focused = scroller.ownerDocument.activeElement;
        const selected = focused?.getAttribute('role') === 'tab' && scroller.contains(focused)
          ? focused : scroller.querySelector('[role="tab"][aria-selected="true"]');
        if (!selected) return;
        // Use the strip's own offsets. A selected tab can be entirely outside the
        // viewport, where rectangles and scrollIntoView disagree about ancestors.
        const vertical = orientation === "vertical";
        const start = vertical ? selected.offsetTop : selected.offsetLeft;
        const extent = vertical ? selected.offsetHeight : selected.offsetWidth;
        const viewStart = vertical ? scroller.scrollTop : scroller.scrollLeft;
        const viewExtent = vertical ? scroller.clientHeight : scroller.clientWidth;
        const delta = selectedTabScrollDelta(viewStart, viewStart + viewExtent, start, start + extent);
        if (Math.abs(delta) > 0.5) {
          if (vertical) scroller.scrollTop += delta;
          else scroller.scrollLeft += delta;
          if (attempts++ < 2) frame = requestAnimationFrame(step);
        }
      };
      frame = requestAnimationFrame(step);
    };
    const observer = new ResizeObserver(keepSelectedVisible);
    observer.observe(scroller);
    // The auto arrows are children of the scroller, not of the Tabs root. Observe
    // the scroller subtree so a tab strip that widens or narrows when the arrows
    // appear or disappear rechecks the selected tab's visibility.
    const mutations = new MutationObserver(keepSelectedVisible);
    mutations.observe(root.current, { childList: true, subtree: true });
    keepSelectedVisible();
    // Capture and measurement can both scroll the page after selection, which
    // resizes the strip again. One late pass after layout settles.
    const late = setTimeout(keepSelectedVisible, 150);
    return () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame); clearTimeout(late); };
  }, [value, orientation]);
  return <Tabs {...props} value={value} orientation={orientation} ref={root} />;
});

export default UiTabs;

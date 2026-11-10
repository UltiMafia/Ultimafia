// Opt-in transcript window. Measurement and scroll compensation share one owner.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  useVirtualizer,
  observeElementOffset,
  measureElement,
} from "@tanstack/react-virtual";
import {
  estimateTranscriptRowHeight,
  transcriptLayoutMetrics,
} from "../../../utils/transcriptRowEstimate";

// Measured row heights survive remounts (switching tabs, leaving and
// re-entering a game), so a transcript that has been read once starts from
// real sizes instead of estimates.
const measuredHeights = new Map();
const MAX_CACHED_HEIGHTS = 8000;

// Only iOS defers corrections through a gesture (the library's own check):
// writes would cancel momentum there, so a wrong height becomes unreachable
// history rather than a written correction. Elsewhere the constant the
// window was tuned with stays in place.
const iOSDefersCorrections = (() => {
  if (typeof navigator === "undefined") return false;
  if (/iP(hone|od|ad)/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 0;
})();
const UNSEEN_ROW_ESTIMATE = iOSDefersCorrections ? 150 : 60;

export function WindowedTranscript({ rows, speechDisplayRef, onScroll, autoScroll }) {
  const initializing = useRef(true);
  const jumpFrame = useRef(null);
  const highlightTimer = useRef(null);
  const edgeFrame = useRef(null);
  const touchDown = useRef(false);
  const touchPeakY = useRef(null);
  const touched = useRef(false);
  const pendingTop = useRef(false);
  const bridgingTop = useRef(false);
  const edgeDeadline = useRef(0);
  const keys = useMemo(() => rows.map((row, index) => row.key ?? index), [rows]);
  const getItemKey = useCallback((index) => keys[index], [keys]);
  // Every row measured during an iOS fling adds its estimate error to the held
  // offset; a held positive offset is scrollable history the element cannot
  // reach, so the fling stops early at a false top. Underestimating row height
  // feeds that exactly, while overestimating only trims space that measuring
  // the row then restores.
  // The virtualizer keeps the estimate callback it was constructed with, so a
  // closure over `rows` goes stale and every unseen row keeps the bare floor.
  // Read the current rows through a ref instead.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // Font size and column width are user settings, so the estimate is derived
  // from the rendered transcript. Measured heights are only valid for the
  // layout they were taken in: a font-size or width change invalidates them.
  const layoutRef = useRef(null);
  useLayoutEffect(() => {
    // Null for a hidden or zero-size transcript: no reader is looking at it,
    // and treating invisibility as a width change destroys their position.
    const layout = transcriptLayoutMetrics(speechDisplayRef.current);
    if (!layout) return;

    const previous = layoutRef.current;
    if (!previous) {
      layoutRef.current = layout;
      return;
    }
    if (previous.signature === layout.signature) return;

    // A real reflow (font size or column width): every row's height changes,
    // so the library's measured sizes are stale and unseen rows need the new
    // estimate. Re-lay the list, but put the reader back on the row and offset
    // they were reading — a bare measure() leaves them wherever the new
    // estimates put index 0.
    const instance = virtualizerRef.current;
    // The DOM scroll position is the truth here; the library's scrollOffset can
    // lag a frame behind, which shifts the anchor by a row.
    const offset = speechDisplayRef.current
      ? speechDisplayRef.current.scrollTop
      : instance.scrollOffset ?? 0;
    const anchorItem = instance
      .getVirtualItems()
      .find((item) => item.end > offset);
    const anchorKey = anchorItem ? anchorItem.key : null;
    const anchorDelta = anchorItem ? offset - anchorItem.start : 0;

    layoutRef.current = layout;
    measuredHeights.clear();
    instance.measure();

    if (anchorKey != null) {
      const index = keys.indexOf(anchorKey);
      const scroller = speechDisplayRef.current;
      if (index >= 0 && scroller) {
        // Bring the row into view from the new layout, then correct against its
        // real box once it has rendered: every height above it is an estimate
        // again, so an offset computed from them lands a row or two out.
        const offsetInfo = instance.getOffsetForIndex(index, "start");
        const newStart = Array.isArray(offsetInfo) ? offsetInfo[0] : null;
        if (typeof newStart === "number") {
          scroller.scrollTop = Math.max(0, newStart + anchorDelta);
        }
        // Rows above are estimates again, so the position settles over a few
        // frames as the rendered ones report their real heights. Converge on
        // the row's box rather than trusting any single offset.
        let stable = 0;
        const align = (attempt) => {
          if (attempt > 12) return;
          const row = scroller.querySelector(`[data-index="${index}"]`);
          if (!row) {
            instance.scrollToIndex(index, { align: "start" });
            requestAnimationFrame(() => align(attempt + 1));
            return;
          }
          const rowTop =
            row.getBoundingClientRect().top -
            scroller.getBoundingClientRect().top;
          // anchorDelta is how far the reader is scrolled *into* the row, so
          // the row's top belongs at negative that; the correction to apply is
          // the difference between where it is and that target.
          const delta = rowTop + anchorDelta;
          if (Math.abs(delta) <= 0.5) {
            if (++stable >= 2) return;
          } else {
            stable = 0;
            scroller.scrollTop += delta;
          }
          requestAnimationFrame(() => align(attempt + 1));
        };
        requestAnimationFrame(() => align(0));
      }
    }
  });

  const estimateSize = useCallback((index) => {
    const row = rowsRef.current[index];
    const key = row && row.key != null ? row.key : null;
    const measured = key == null ? undefined : measuredHeights.get(key);
    if (measured != null) return measured;

    // A constant cannot describe rows that run to the 240-character limit: an
    // estimate under the real height leaves unreachable history on the platform
    // that holds corrections through the gesture rather than writing them.
    // Everywhere else the constant stays as it is — a larger estimated scroll
    // height costs something, and those platforms were never the failing case.
    if (!iOSDefersCorrections) return UNSEEN_ROW_ESTIMATE;

    return estimateTranscriptRowHeight(row, UNSEEN_ROW_ESTIMATE, layoutRef.current);
  }, []);
  const virtualizerRef = useRef(null);
  const scrollOffsetObserver = useRef(null);
  const observeScrollOffset = useCallback((instance, onOffset) => {
    scrollOffsetObserver.current = onOffset;
    const cleanup = observeElementOffset(instance, onOffset);
    return () => {
      if (scrollOffsetObserver.current === onOffset) {
        scrollOffsetObserver.current = null;
      }
      cleanup?.();
    };
  }, []);
  const measureTranscriptRow = useCallback((element, entry, instance) => {
    // A size notification can precede the latest native scroll event. Feed that
    // offset through the public observer before compensation, so measuring an
    // overscanned row cannot cancel a reader's just-completed scroll movement.
    const offset = instance.scrollElement?.scrollTop;
    if (!iOSDefersCorrections && offset != null && offset !== instance.scrollOffset) {
      scrollOffsetObserver.current?.(offset, instance.isScrolling);
    }
    return measureElement(element, entry, instance);
  }, []);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => speechDisplayRef.current,
    getItemKey,
    estimateSize,
    overscan: 8,
    observeElementOffset: observeScrollOffset,
    measureElement: measureTranscriptRow,
    // Schedule size work outside the active ResizeObserver delivery. The public
    // offset observer above still adopts intervening native motion before each
    // measurement, so this does not compensate from a stale scroll position.
    useAnimationFrameWithResizeObserver: true,
    anchorTo: "end",
    followOnAppend: autoScroll,
    scrollEndThreshold: 10,
  });
  virtualizerRef.current = virtualizer;

  // All deltas above the first visible item must be compensated, in either
  // direction. A re-measured item spanning the fold grows below the reading
  // anchor; moving for that delta would itself create a jump.
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (item, _delta, instance) => {
    const offset = instance.scrollOffset ?? 0;
    return instance.itemSizeCache.has(item.key)
      ? item.end <= offset
      : item.start < offset;
  };

  const rowIndex = useMemo(() => {
    const index = new Map();
    rows.forEach((row, i) => {
      const id = row.props.message.id;
      if (id != null) index.set(String(id), { index: i, id });
      if (row.props.replyMerged && row.props.replyQuote?.id != null)
        index.set(String(row.props.replyQuote.id), { index: i, id });
    });
    return index;
  }, [rows]);

  const recordMeasured = useCallback(() => {
    for (const [key, size] of virtualizerRef.current.itemSizeCache) {
      // Index fallbacks are numbers; only message-identity keys are portable.
      if (size > 0 && typeof key === "string") measuredHeights.set(key, size);
    }
    if (measuredHeights.size > MAX_CACHED_HEIGHTS) {
      const excess = measuredHeights.size - MAX_CACHED_HEIGHTS;
      let index = 0;
      for (const key of measuredHeights.keys()) {
        if (index++ >= excess) break;
        measuredHeights.delete(key);
      }
    }
  }, []);

  useLayoutEffect(() => {
    virtualizer.scrollToEnd();
    const timer = setTimeout(recordMeasured, 200);
    return () => clearTimeout(timer);
  }, [virtualizer, recordMeasured]);

  // A keyboard changes the viewport without appending data. Keep an already
  // following reader pinned, but never pull someone away from older messages.
  useEffect(() => {
    const scroller = speechDisplayRef.current;
    if (!autoScroll || !scroller) return;
    let width = scroller.clientWidth;
    let height = scroller.clientHeight;
    let frame;
    const observer = new ResizeObserver(() => {
      // scrollToEnd may synchronously commit measured rows. Do not start that
      // layout work inside the active ResizeObserver delivery.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextWidth = scroller.clientWidth;
        const nextHeight = scroller.clientHeight;
        if (nextWidth === width && nextHeight === height) return;
        width = nextWidth;
        height = nextHeight;
        if (width > 0 && height > 0) virtualizer.scrollToEnd();
      });
    });
    observer.observe(scroller);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [autoScroll, speechDisplayRef, virtualizer]);

  useEffect(() => () => {
    cancelAnimationFrame(jumpFrame.current);
    cancelAnimationFrame(edgeFrame.current);
    clearTimeout(highlightTimer.current);
    recordMeasured();
  }, [recordMeasured]);

  useEffect(() => {
    const scroller = speechDisplayRef.current;
    if (!scroller) return;
    const jump = (event) => {
      const target = rowIndex.get(String(event.detail.messageId));
      if (!target) return;
      initializing.current = false;
      cancelAnimationFrame(jumpFrame.current);
      virtualizer.scrollToIndex(target.index, { align: "center" });
      const deadline = performance.now() + 1500;
      const finish = () => {
        const row = [...scroller.querySelectorAll(".message[data-message-id]")]
          .find((element) => element.dataset.messageId === String(target.id));
        if (row) {
          row.classList.remove("reply-jump-highlight");
          void row.offsetWidth;
          row.classList.add("reply-jump-highlight");
          clearTimeout(highlightTimer.current);
          highlightTimer.current = setTimeout(() => row.classList.remove("reply-jump-highlight"), 1600);
        } else if (performance.now() < deadline) {
          jumpFrame.current = requestAnimationFrame(finish);
        }
      };
      jumpFrame.current = requestAnimationFrame(finish);
    };
    scroller.addEventListener("transcript-jump", jump);
    return () => {
      scroller.removeEventListener("transcript-jump", jump);
      cancelAnimationFrame(jumpFrame.current);
    };
  }, [rowIndex, speechDisplayRef, virtualizer]);

  const setScroller = useCallback((element) => {
    speechDisplayRef.current = element;
  }, [speechDisplayRef]);
  const checkTopEdge = useCallback(function queueTopEdge() {
    if (!edgeDeadline.current) edgeDeadline.current = performance.now() + 3000;
    cancelAnimationFrame(edgeFrame.current);
    edgeFrame.current = requestAnimationFrame(() => {
      const scroller = speechDisplayRef.current;
      if (!scroller || touchDown.current || !pendingTop.current || bridgingTop.current) return;
      if (performance.now() > edgeDeadline.current || !scroller.clientHeight || !virtualizer.options.count) {
        pendingTop.current = false;
        edgeDeadline.current = 0;
        return;
      }
      const first = scroller.querySelector('[data-index="0"]');
      const atFirst = first && Math.abs(first.getBoundingClientRect().top - scroller.getBoundingClientRect().top) < 2;
      if (atFirst) {
        pendingTop.current = false;
        edgeDeadline.current = 0;
        return;
      }
      // A held iOS growth leaves the native top short of the logical top. Once
      // the finger is up, let its correction settle before issuing a new target.
      // Starting a smooth command against still-shifted coordinates can strand
      // legacy iOS at native zero. Check after observers, using public offsets.
      const offset = virtualizer.scrollOffset ?? 0;
      if (offset <= 1 || Math.abs(offset - scroller.scrollTop) > 1) {
        queueTopEdge();
        return;
      }
      pendingTop.current = false;
      edgeDeadline.current = 0;
      bridgingTop.current = true;
      virtualizer.scrollToIndex(0, { align: "start", behavior: "smooth" });
    });
  }, [speechDisplayRef, virtualizer]);
  const handleTouchStart = useCallback((event) => {
    touchDown.current = true;
    touchPeakY.current = event.touches?.[0]?.clientY ?? null;
    touched.current = true;
    pendingTop.current = false;
    edgeDeadline.current = 0;
    cancelAnimationFrame(edgeFrame.current);
    if (bridgingTop.current) virtualizer.cancelScroll();
    bridgingTop.current = false;
  }, [virtualizer]);
  const handleTouchMove = useCallback((event) => {
    const y = event.touches?.length === 1 ? event.touches[0].clientY : null;
    if (y == null || touchPeakY.current == null) return;
    touchPeakY.current = Math.max(touchPeakY.current, y);
    // Finger-up means reading downward, even while rubber-banding keeps the
    // native scroll position at/below zero. Do not infer that intent from
    // scrollTop becoming positive: it may not do so until after touchend.
    if (touched.current && y < touchPeakY.current - 4) {
      touched.current = false;
      pendingTop.current = false;
      edgeDeadline.current = 0;
      cancelAnimationFrame(edgeFrame.current);
    }
  }, []);
  const handleTouchEnd = useCallback(() => {
    touchDown.current = false;
    // A bounce may re-arm the edge after touchstart canceled the old fling.
    // If this drag has left the top, it replaces that intent; do not complete
    // the old upward navigation when the finger releases (even if scroll events
    // for the downward movement have not been delivered yet).
    if (pendingTop.current && speechDisplayRef.current?.scrollTop > 1) {
      touched.current = false;
      pendingTop.current = false;
      edgeDeadline.current = 0;
      cancelAnimationFrame(edgeFrame.current);
    }
    if (pendingTop.current) checkTopEdge();
  }, [checkTopEdge, speechDisplayRef]);
  const handleScroll = useCallback((event) => {
    const scroller = speechDisplayRef.current;
    if (initializing.current) {
      if (!scroller || scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop >= 10) return;
      initializing.current = false;
    }
    if (touchDown.current && pendingTop.current && scroller?.scrollTop > 1) {
      // Reversal during the bounce invalidates top completion for the remainder
      // of this gesture, not just until the next bounce-generated scroll event.
      touched.current = false;
      pendingTop.current = false;
      edgeDeadline.current = 0;
      cancelAnimationFrame(edgeFrame.current);
    } else if (touched.current && scroller?.scrollTop <= 1 && !bridgingTop.current) {
      pendingTop.current = true;
      if (!touchDown.current) checkTopEdge();
    }
    onScroll(event);
  }, [checkTopEdge, onScroll, speechDisplayRef]);

  const items = virtualizer.getVirtualItems();
  // Unresolved quotes can render nothing. Match the original DOM's last child,
  // not an empty logical tail whose measured wrapper has zero height.
  let lastRowIndex = rows.length - 1;
  while (lastRowIndex >= 0 && virtualizer.itemSizeCache.get(keys[lastRowIndex]) === 0) lastRowIndex--;
  const firstItem = items[0];
  const windowStart = firstItem?.start ?? 0;
  const windowHeight = items.length ? items[items.length - 1].end - windowStart : 0;
  // iOS holds offset corrections until the finger/fling releases. A held
  // shrink shifts even item zero down, temporarily inventing scrollable space
  // before history. Bound that window with native sticky positioning: its top
  // cannot descend below the viewport top, while its normal upward motion is
  // untouched. Only item zero qualifies; real offscreen history stays scrollable.
  // No scrollTop writes, private gesture hooks, or per-scroll React updates.
  const boundHistoryStart = firstItem?.index === 0 && windowStart > 0;

  return (
    <div
      className="speech-display"
      data-name-animation-viewport
      data-transcript-window="anchored-v8"
      style={{ display: "block", position: "relative", overflowAnchor: "none" }}
      ref={setScroller}
      onScroll={handleScroll}
      onTouchStartCapture={handleTouchStart}
      onTouchMoveCapture={handleTouchMove}
      onTouchEndCapture={handleTouchEnd}
      onTouchCancelCapture={handleTouchEnd}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%", display: "flow-root" }}>
        <div aria-hidden="true" style={{ height: boundHistoryStart ? windowStart : 0 }} />
        <div style={{
          position: boundHistoryStart ? "sticky" : "absolute",
          top: boundHistoryStart ? undefined : windowStart,

          bottom: boundHistoryStart ? (virtualizer.scrollRect?.height ?? 0) - windowHeight : undefined,
          height: windowHeight,
          width: "100%",
        }}>
        {items.map((item) => (
          <div
            key={item.key}
            className="transcript-window-row"
            data-index={item.index}
            data-transcript-last-row={item.index === lastRowIndex ? "true" : undefined}
            ref={virtualizer.measureElement}
            style={{ position: "absolute", top: item.start - windowStart, left: 0, width: "100%", display: "flow-root", overflowAnchor: "none" }}
          >
            {rows[item.index]}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

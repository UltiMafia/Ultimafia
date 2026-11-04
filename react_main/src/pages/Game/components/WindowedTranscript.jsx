// Opt-in transcript window. Measurement and scroll compensation share one owner.
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

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
  // Heights may only be shared under a key that identifies the message across
  // mounts; an index fallback would mix different games' rows.
  const stableKeys = useMemo(() => rows.map((row) => row.key ?? null), [rows]);
  const getItemKey = useCallback((index) => keys[index], [keys]);
  // Every row measured during an iOS fling adds its estimate error to the held
  // offset; a held positive offset is scrollable history the element cannot
  // reach, so the fling stops early at a false top. Underestimating row height
  // feeds that exactly, while overestimating only trims space that measuring
  // the row then restores.
  const estimateSize = useCallback((index) => {
    const key = stableKeys[index];
    return (key == null ? undefined : measuredHeights.get(key)) ?? UNSEEN_ROW_ESTIMATE;
  }, [stableKeys]);
  const virtualizerRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => speechDisplayRef.current,
    getItemKey,
    estimateSize,
    overscan: 8,
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
    const observer = new ResizeObserver(() => {
      const nextWidth = scroller.clientWidth;
      const nextHeight = scroller.clientHeight;
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      if (width > 0 && height > 0) virtualizer.scrollToEnd();
    });
    observer.observe(scroller);
    return () => observer.disconnect();
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

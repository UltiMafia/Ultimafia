import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Box, ButtonBase, Drawer } from "@mui/material";
import { useLocation } from "react-router-dom";

import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";

// A sheet for content that would otherwise be an anchored popover: the phone
// answer to "tap a thing, see its details" -- a bottom sheet, reachable by
// thumb, instead of a card pinned to whatever you tapped. Wider screens keep
// the anchored card, which is the right tool with a mouse.
//
// The sheet renders an element the caller builds and knows nothing about what
// is inside it: a player card, a role's details, a game's information, the role
// marker. The opener can pass onClose to reset its own state when the sheet is
// dismissed from the sheet's own UI (backdrop tap, Escape, swipe).
export const SheetContext = createContext({
  openSheet: () => {},
  closeSheet: () => {},
});

export function SheetProvider({ children }) {
  const isPhone = useIsPhoneDevice();
  const location = useLocation();

  // Kept while the drawer animates shut, so the closing sheet still shows its
  // content instead of emptying out first.
  const [sheet, setSheet] = useState(null);
  const [open, setOpen] = useState(false);
  const paperRef = useRef(null);
  const dragFrameRef = useRef(null);
  const pendingDragDistanceRef = useRef(0);
  const dragStartRef = useRef(null);
  const draggedRef = useRef(false);

  const openRef = useRef(false);
  openRef.current = open;
  const onCloseRef = useRef(null);

  // Pointer motion must not re-render the provider and every sheet consumer.
  // Translate is independent of Slide's transform, so dismissal can still
  // animate from the position reached by the drag. Write the property directly:
  // an inherited custom property can invalidate styles throughout the sheet.
  const setDragDistance = useCallback((distance, immediate = false) => {
    pendingDragDistanceRef.current = distance;
    const apply = () => {
      dragFrameRef.current = null;
      if (paperRef.current) {
        paperRef.current.style.translate = `0 ${pendingDragDistanceRef.current}px`;
      }
    };

    // Reset/release synchronously; otherwise coalesce high-frequency pointer
    // events into one update per display frame.
    if (immediate || distance === 0) {
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      apply();
    } else if (dragFrameRef.current === null) {
      dragFrameRef.current = requestAnimationFrame(apply);
    }
  }, []);

  useEffect(() => () => {
    if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
  }, []);

  const closeSheet = useCallback(() => {
    const onClose = onCloseRef.current;
    onCloseRef.current = null;
    setOpen(false);
    if (onClose) onClose();
  }, []);

  const openSheet = useCallback((node, { onClose = null } = {}) => {
    onCloseRef.current = onClose;
    setDragDistance(0);
    setSheet({ node });
    setOpen(true);
  }, [setDragDistance]);

  // Restore the nav before the closing animation paints, so the descending
  // sheet reveals it instead of leaving an empty space that fills afterwards.
  // The drawer's backdrop still blocks interaction until the animation ends.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (open) root.setAttribute("data-sheet", "open");
    else root.removeAttribute("data-sheet");
    return () => root.removeAttribute("data-sheet");
  }, [open]);

  // The sheet belongs to the view it was opened from: a tap on a link inside it
  // navigates, and the sheet goes with the old view.
  useEffect(() => {
    closeSheet();
  }, [location.pathname, location.search, closeSheet]);

  const value = { openSheet, closeSheet, sheetOpen: open };

  return (
    <SheetContext.Provider value={value}>
      {children}
      <Drawer
        anchor={isPhone ? "bottom" : "right"}
        open={open}
        onClose={closeSheet}
        slotProps={{
          transition: {
            onExited: () => {
              // A sheet opened during the closing animation must not be cleared.
              if (!openRef.current) {
                setSheet(null);
                setDragDistance(0);
              }
            },
          },
          paper: {
            ref: paperRef,
            sx: isPhone
              ? {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxHeight: "70vh",
                  boxShadow: "0 -5px 20px rgba(0, 0, 0, 0.28)",
                  // Keep the contents/shadow in a composited layer while the
                  // mounted sheet moves, rather than repainting them each frame.
                  willChange: "translate, transform",
                  // The sheet is the bottom surface on a phone (the nav is
                  // hidden while it is open), so where the browser leaves the
                  // home-indicator strip to the page, the sheet fills it.
                  paddingBottom: "var(--bottom-safe-area)",
                }
              : { width: 360 },
          },
        }}
      >
        {isPhone && (
          <ButtonBase
            className="mui-popover-title"
            aria-label="Close sheet"
            onClick={(event) => {
              // A short drag snaps back; its synthesized click must not close
              // the sheet. Keyboard activation still closes it.
              if (!draggedRef.current || event.detail === 0) closeSheet();
            }}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              dragStartRef.current = event.clientY;
              draggedRef.current = false;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (dragStartRef.current === null) return;
              if (Math.abs(event.clientY - dragStartRef.current) > 4) {
                draggedRef.current = true;
              }
              setDragDistance(Math.max(0, event.clientY - dragStartRef.current));
            }}
            onPointerUp={(event) => {
              const start = dragStartRef.current;
              dragStartRef.current = null;
              if (start !== null && event.clientY - start >= 40) {
                // Keep the offset through the exit animation rather than
                // jumping back to the resting position before sliding out.
                setDragDistance(event.clientY - start, true);
                closeSheet();
              } else {
                setDragDistance(0);
              }
            }}
            onPointerCancel={() => {
              dragStartRef.current = null;
              setDragDistance(0);
            }}
            disableRipple
            sx={{
              width: "100%",
              minHeight: 28,
              flexShrink: 0,
              touchAction: "none",
              // Use exactly the same background rule as the adjacent title.
              backgroundImage: "none",
              borderBottom: 0,
              padding: 0,
              borderRadius: "16px 16px 0 0",
              "&.Mui-focusVisible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: -2,
              },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 32,
                height: 3,
                borderRadius: 2,
                bgcolor: "text.secondary",
                opacity: 0.4,
              }}
            />
          </ButtonBase>
        )}
        <Box sx={{ overflowY: "auto" }}>{sheet && sheet.node}</Box>
      </Drawer>
    </SheetContext.Provider>
  );
}

export function useSheet() {
  return useContext(SheetContext);
}

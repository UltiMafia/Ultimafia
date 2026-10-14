import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Box, Drawer } from "@mui/material";
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

  const openRef = useRef(false);
  openRef.current = open;
  const onCloseRef = useRef(null);

  const closeSheet = useCallback(() => {
    const onClose = onCloseRef.current;
    onCloseRef.current = null;
    setOpen(false);
    if (onClose) onClose();
  }, []);

  const openSheet = useCallback((node, { onClose = null } = {}) => {
    onCloseRef.current = onClose;
    setSheet({ node });
    setOpen(true);
  }, []);

  // While a sheet exists the site bottom navigation is hidden (see
  // css/main.css): it would otherwise sit directly under the sheet, dimmed by
  // the modal backdrop and dead to touch. Keyed on the sheet rather than on
  // `open` so the nav does not reappear under the sheet while it animates shut.
  useEffect(() => {
    const root = document.documentElement;
    if (sheet) root.setAttribute("data-sheet", "open");
    else root.removeAttribute("data-sheet");
    return () => root.removeAttribute("data-sheet");
  }, [sheet]);

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
              if (!openRef.current) setSheet(null);
            },
          },
          paper: {
            sx: isPhone
              ? {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  maxHeight: "70vh",
                  // The sheet is the bottom surface on a phone (the nav is
                  // hidden while it is open), so where the browser leaves the
                  // home-indicator strip to the page, the sheet fills it.
                  paddingBottom: "var(--bottom-safe-area)",
                }
              : { width: 360 },
          },
        }}
      >
        <Box sx={{ overflowY: "auto" }}>{sheet && sheet.node}</Box>
      </Drawer>
    </SheetContext.Provider>
  );
}

export function useSheet() {
  return useContext(SheetContext);
}

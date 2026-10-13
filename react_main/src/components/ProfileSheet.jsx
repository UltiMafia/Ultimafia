import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { Box, Drawer } from "@mui/material";
import { useLocation } from "react-router-dom";

import Miniprofile from "./Miniprofile";
import { useIsPhoneDevice } from "../hooks/useIsPhoneDevice";
import { useDismissOnBack } from "../hooks/useDismissOnBack";

export const ProfileSheetContext = createContext({
  openProfile: () => {},
  closeProfile: () => {},
});

// A profile shown as a sheet over whatever is on screen -- a bottom sheet on a
// phone, a side panel on desktop -- instead of navigating away or opening a tab.
// This matches how the native app lets you check a player mid-game.
export function ProfileSheetProvider({ children }) {
  const isPhone = useIsPhoneDevice();
  const location = useLocation();
  const [request, setRequest] = useState(null); // { id, props, gameId }
  const [profile, setProfile] = useState(null);

  const profileRef = useRef(null);
  profileRef.current = profile;

  // The bottom navigation is part of the site shell, which is hidden while a
  // game is full screen. When it is visible, lift the sheet above it. This is
  // decided when the sheet opens and held until the next open, so navigating
  // (for example tapping the name link) does not shift the sheet mid-close.
  const navVisibleRef = useRef(false);
  navVisibleRef.current = isPhone && !location.pathname.startsWith("/game/");
  const [aboveNav, setAboveNav] = useState(false);

  const openProfile = useCallback((id, props, gameId) => {
    if (!id) return;
    const nextProps = props || {};
    setAboveNav(navVisibleRef.current);

    // Already loaded for this user: open straight away.
    if (profileRef.current && profileRef.current.id === id) {
      setRequest({ id, props: nextProps, gameId });
      return;
    }

    // Fetch first, then open. Opening immediately with a skeleton made the
    // bottom sheet slide up, grow, and re-animate once the content arrived.
    axios
      .get(`/api/user/${id}/profile`)
      .then((res) => {
        res.data.props = nextProps;
        setProfile(res.data);
        setRequest({ id, props: nextProps, gameId });
      })
      .catch(() => {});
  }, []);

  // Keep the loaded profile while closing, so the closing animation shows the
  // content. It is replaced on the next open of a different profile.
  const closeProfile = useCallback(() => {
    setRequest(null);
  }, []);

  // Close the sheet when the route changes, e.g. when the name link inside it
  // navigates to the full profile.
  useEffect(() => {
    setRequest(null);
  }, [location.pathname, location.search]);

  useDismissOnBack(Boolean(request), closeProfile);

  const open = Boolean(request);

  return (
    <ProfileSheetContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      <Drawer
        anchor={isPhone ? "bottom" : "right"}
        open={open}
        onClose={closeProfile}
        PaperProps={{
          sx: isPhone
            ? {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: "70vh",
                marginBottom: aboveNav
                  ? "calc(56px + env(safe-area-inset-bottom, 0px))"
                  : undefined,
              }
            : { width: 360 },
        }}
      >
        <Box sx={{ overflowY: "auto" }}>
          {profile && (
            <Miniprofile
              user={profile}
              game={request?.gameId ? { gameId: request.gameId } : null}
            />
          )}
        </Box>
      </Drawer>
    </ProfileSheetContext.Provider>
  );
}

export function useProfileSheet() {
  return useContext(ProfileSheetContext);
}

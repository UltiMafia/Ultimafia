import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { Box, Drawer, Skeleton, Stack } from "@mui/material";
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

  // The bottom navigation is part of the site shell, which is hidden while a
  // game is full screen. When it is visible, lift the sheet above it so the
  // sheet does not cover the navigation.
  const navVisible = isPhone && !location.pathname.startsWith("/game/");

  const openProfile = useCallback((id, props, gameId) => {
    if (!id) return;
    // Re-opening the same profile (a duplicate click, say) must not blank and
    // reload the sheet.
    setRequest((current) =>
      current && current.id === id
        ? current
        : { id, props: props || {}, gameId }
    );
    setProfile((current) => (current && current.id === id ? current : null));
  }, []);

  const closeProfile = useCallback(() => {
    setRequest(null);
    setProfile(null);
  }, []);

  // Close the sheet when the route changes, e.g. when the name link inside it
  // navigates to the full profile.
  useEffect(() => {
    setRequest(null);
    setProfile(null);
  }, [location.pathname, location.search]);

  const open = Boolean(request);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    axios
      .get(`/api/user/${request.id}/profile`)
      .then((res) => {
        if (cancelled) return;
        res.data.props = request.props;
        setProfile(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [request]);

  useDismissOnBack(open, closeProfile);

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
                marginBottom: navVisible
                  ? "calc(56px + env(safe-area-inset-bottom, 0px))"
                  : undefined,
              }
            : { width: 360 },
        }}
      >
        <Box sx={{ overflowY: "auto" }}>
          {profile ? (
            <Miniprofile
              user={profile}
              game={request?.gameId ? { gameId: request.gameId } : null}
            />
          ) : (
            <Stack spacing={1.5} sx={{ p: 2 }}>
              <Skeleton variant="circular" width={64} height={64} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="rounded" height={120} />
            </Stack>
          )}
        </Box>
      </Drawer>
    </ProfileSheetContext.Provider>
  );
}

export function useProfileSheet() {
  return useContext(ProfileSheetContext);
}

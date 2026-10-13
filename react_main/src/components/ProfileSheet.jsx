import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { Box, Drawer, Skeleton, Stack } from "@mui/material";

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
  const [request, setRequest] = useState(null); // { id, props, gameId }
  const [profile, setProfile] = useState(null);

  const openProfile = useCallback((id, props, gameId) => {
    if (!id) return;
    setProfile(null);
    setRequest({ id, props: props || {}, gameId });
  }, []);

  const closeProfile = useCallback(() => {
    setRequest(null);
    setProfile(null);
  }, []);

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
                maxHeight: "85vh",
              }
            : { width: 380 },
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

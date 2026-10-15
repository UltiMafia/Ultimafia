import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useSheet } from "./Sheet";
import { useAppLocation } from "../hooks/useViewActivity";
import { LatestRequest } from "../lib/latestRequest.js";

export const ProfileSheetContext = createContext({ openProfile: () => {}, closeProfile: () => {} });

export function ProfileSheetProvider({ children }) {
  const { reserveSheet } = useSheet();
  const location = useAppLocation();
  const requests = useRef(new LatestRequest());
  const sheetRequestRef = useRef(null);
  const cache = useRef(null);

  const closeProfile = useCallback(() => {
    requests.current.invalidate();
    sheetRequestRef.current?.close();
    sheetRequestRef.current = null;
  }, []);

  useLayoutEffect(() => {
    closeProfile();
    return closeProfile;
  }, [location.key, location.pathname, location.search, location.hash, closeProfile]);

  const openProfile = useCallback(async (id, props = {}, gameId) => {
    if (!id) return;
    requests.current.invalidate();
    const sheetRequest = reserveSheet(() => requests.current.invalidate());
    sheetRequestRef.current = sheetRequest;
    const request = requests.current.begin();
    try {
      // Load code and data together before opening: a Suspense placeholder can
      // otherwise change the drawer's height during its first slide-in.
      const [data, { default: Miniprofile }] = await Promise.all([
        cache.current?.id === id
          ? cache.current
          : axios.get(`/api/user/${id}/profile`, { signal: request.signal }).then((res) => res.data),
        import("./Miniprofile"),
      ]);
      if (!request.isCurrent() || !sheetRequest.isCurrent()) return;
      if (!data || data.id !== id) {
        sheetRequest.close();
        return;
      }
      cache.current = data;
      // Cache data only: caller-specific props/game ids must be fresh on reopen.
      sheetRequest.show(() => (
        <Miniprofile user={{ ...data, props }} game={gameId ? { gameId } : null} />
      ));
    } catch (_) {
      if (request.isCurrent()) sheetRequest.close();
    }
  }, [reserveSheet]);

  const value = useMemo(() => ({ openProfile, closeProfile }), [openProfile, closeProfile]);
  return <ProfileSheetContext.Provider value={value}>{children}</ProfileSheetContext.Provider>;
}

export function useProfileSheet() {
  return useContext(ProfileSheetContext);
}

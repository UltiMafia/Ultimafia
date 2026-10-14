import React, {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import axios from "axios";

import { ProfileSkeleton } from "./Skeletons";
import { useSheet } from "./Sheet";

// Miniprofile only renders once the sheet is open, and it drags in d3 (via
// PieChart) and react-mde (via ReportDialog -> Form). Keep it out of the
// initial bundle; the sheet fetches the profile before opening, so the chunk
// is requested at the same time as the data.
const Miniprofile = lazy(() => import("./Miniprofile"));

export const ProfileSheetContext = createContext({
  openProfile: () => {},
  closeProfile: () => {},
});

// A player's profile, in the shared sheet -- a bottom sheet on a phone, a side
// panel on desktop -- instead of navigating away or opening a tab. This matches
// how the native app lets you check a player mid-game.
export function ProfileSheetProvider({ children }) {
  const { openSheet, closeSheet } = useSheet();
  const [profile, setProfile] = useState(null);

  const profileRef = useRef(null);
  profileRef.current = profile;

  // Whether the sheet on screen is ours, so closeProfile cannot close someone
  // else's (a role's details, a game's information).
  const showingRef = useRef(false);

  const show = useCallback(
    (data, gameId) => {
      const node = (
        <Suspense fallback={<ProfileSkeleton />}>
          <Miniprofile user={data} game={gameId ? { gameId } : null} />
        </Suspense>
      );

      showingRef.current = true;
      openSheet(node, {
        onClose: () => {
          showingRef.current = false;
        },
      });
    },
    [openSheet]
  );

  const openProfile = useCallback(
    (id, props, gameId) => {
      if (!id) return;
      const nextProps = props || {};

      // Already loaded for this user: open straight away. The loaded profile is
      // also kept between opens, so a reopen does not refetch.
      if (profileRef.current && profileRef.current.id === id) {
        show(profileRef.current, gameId);
        return;
      }

      // Fetch first, then open. Opening immediately with a skeleton made the
      // bottom sheet slide up, grow, and re-animate once the content arrived.
      axios
        .get(`/api/user/${id}/profile`)
        .then((res) => {
          res.data.props = nextProps;
          setProfile(res.data);
          show(res.data, gameId);
        })
        .catch(() => {});
    },
    [show]
  );

  const closeProfile = useCallback(() => {
    if (showingRef.current) closeSheet();
  }, [closeSheet]);

  return (
    <ProfileSheetContext.Provider value={{ openProfile, closeProfile }}>
      {children}
    </ProfileSheetContext.Provider>
  );
}

export function useProfileSheet() {
  return useContext(ProfileSheetContext);
}

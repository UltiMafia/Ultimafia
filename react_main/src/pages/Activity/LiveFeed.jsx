import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  Box,
  ButtonBase,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
import { UserContext } from "Contexts";
import ActivityRow from "./ActivityRow";

// Three mutually-exclusive category tabs. Each owns a set of per-type sub
// filters (shown as chips under the tab). `serverCategory` tells the backend
// which collections to read from; `types` limits the rows to the selected
// actions after they come back.
const CATEGORIES = [
  {
    key: "content",
    label: "Content",
    serverCategories: ["comments", "forum", "setups", "polls", "upvotes"],
    types: [
      { key: "comment", label: "Comments", match: ["comment"], defaultOn: true },
      { key: "forum", label: "Forum", match: ["thread", "forumReply"], defaultOn: true },
      { key: "setups", label: "Setups", match: ["setupCreate", "setupEdit"], defaultOn: true },
      { key: "polls", label: "Polls", match: ["pollVote"], defaultOn: true },
      { key: "upvotes", label: "Upvotes", match: ["upvote"], defaultOn: false },
    ],
  },
  {
    key: "profile",
    label: "Profile",
    serverCategories: ["profile", "logins"],
    types: [
      { key: "name", label: "Name", match: ["nameChange"], defaultOn: true },
      { key: "avatar", label: "Avatar", match: ["avatarChange"], defaultOn: true },
      { key: "settings", label: "Settings", match: ["settingsChange"], defaultOn: true },
      { key: "decks", label: "Decks", match: ["deckCreate"], defaultOn: true },
      { key: "stamps", label: "Stamp trades", match: ["stampTrade"], defaultOn: true },
      { key: "logins", label: "Logins", match: ["login"], defaultOn: false },
    ],
  },
  {
    key: "mod",
    label: "Mod",
    serverCategories: ["mod"],
    types: [
      { key: "modAction", label: "Mod actions", match: ["modAction"], defaultOn: true },
      { key: "reports", label: "Reports", match: ["report"], defaultOn: true },
      { key: "trophies", label: "Trophies", match: ["trophyAward"], defaultOn: true },
    ],
  },
];

function defaultTypeSet(category) {
  return new Set(category.types.filter((t) => t.defaultOn).map((t) => t.key));
}

function FilterChip({ label, active, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        border: 1,
        borderColor: active ? "primary.main" : "divider",
        backgroundColor: active
          ? (t) => `${t.palette.primary.main}22`
          : "transparent",
        color: active ? "primary.main" : "text.secondary",
        fontSize: "0.72rem",
        fontFamily: "Roboto",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        lineHeight: 1.4,
        transition:
          "background-color .18s ease, border-color .18s ease, color .18s ease",
        "&:hover": {
          borderColor: active ? "primary.main" : "text.secondary",
          color: active ? "primary.main" : "text.primary",
        },
      }}
    >
      {label}
    </ButtonBase>
  );
}

export default function LiveFeed({ windowKey }) {
  const errorAlert = useErrorAlert();
  const user = useContext(UserContext);
  // `useErrorAlert` returns a fresh function each render, so binding it
  // through a ref keeps `load`'s identity stable — otherwise the useEffect
  // below re-fires every render and we request-spam the backend.
  const errorAlertRef = useRef(errorAlert);
  errorAlertRef.current = errorAlert;
  const [categoryIdx, setCategoryIdx] = useState(0);
  // Per-category selected-types state. Keyed by category.key so switching
  // tabs preserves the chips the admin previously chose.
  const [typesByCat, setTypesByCat] = useState(() =>
    Object.fromEntries(
      CATEGORIES.map((c) => [c.key, defaultTypeSet(c)])
    )
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const categories = useMemo(() => {
    if (user?.perms?.seeModPanel) return CATEGORIES;
    return CATEGORIES.filter((c) => c.key !== "mod");
  }, [user?.perms?.seeModPanel]);

  useEffect(() => {
    if (categoryIdx >= categories.length) {
      setCategoryIdx(0);
    }
  }, [categoryIdx, categories.length]);

  const category = categories[categoryIdx] || categories[0];
  const activeTypes = typesByCat[category.key];

  // Depend on categoryIdx (primitive) rather than `category` (a fresh object
  // reference each render), otherwise useCallback + useEffect re-fire on
  // every render and the feed is stuck in a "Loading…" refetch loop.
  const load = useCallback(() => {
    setLoading(true);
    const selectedCategory = categories[categoryIdx] || categories[0];
    const cats = selectedCategory.serverCategories.join(",");
    axios
      .get(`/api/site-activity/feed`, {
        params: { window: windowKey, categories: cats, page },
      })
      .then((res) => {
        setItems(res.data?.items || []);
        setHasMore(Boolean(res.data?.hasMore));
      })
      .catch((e) => errorAlertRef.current(e))
      .finally(() => setLoading(false));
  }, [windowKey, categoryIdx, page, categories]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to first page when window or category changes so the user isn't
  // stuck on page N of a new filter's result set.
  useEffect(() => {
    setPage(0);
  }, [windowKey, categoryIdx]);

  function toggleType(key) {
    setTypesByCat((prev) => {
      const next = new Set(prev[category.key]);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, [category.key]: next };
    });
  }

  // Map from server row `type` to which category-sub-filter owns it.
  const typeMatch = useMemo(() => {
    const map = {};
    for (const t of category.types) {
      for (const m of t.match) map[m] = t.key;
    }
    return map;
  }, [category]);

  const visibleItems = useMemo(() => {
    return items.filter((it) => {
      const subKey = typeMatch[it.type];
      // If a row's type isn't owned by any sub-filter in this tab, hide it.
      if (!subKey) return false;
      return activeTypes.has(subKey);
    });
  }, [items, typeMatch, activeTypes]);

  return (
    <Stack direction="column" spacing={2.5}>
      <Tabs
        value={categoryIdx}
        onChange={(_, v) => setCategoryIdx(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          "& .MuiTab-root": {
            fontFamily: "RobotoSlab",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: "0.72rem",
            minHeight: 36,
            minWidth: 84,
          },
          "& .MuiTab-root.Mui-selected": { color: "primary.main" },
          "& .MuiTabs-indicator": {
            height: 2,
            backgroundColor: "primary.main",
          },
        }}
      >
        {categories.map((c) => (
          <Tab key={c.key} label={c.label} />
        ))}
      </Tabs>

      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        {category.types.map((t) => (
          <FilterChip
            key={t.key}
            label={t.label}
            active={activeTypes.has(t.key)}
            onClick={() => toggleType(t.key)}
          />
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <ButtonBase
          onClick={load}
          disabled={loading}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            border: 1,
            borderColor: "divider",
            color: loading ? "text.disabled" : "primary.main",
            fontSize: "0.72rem",
            fontFamily: "Roboto",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            transition: "border-color .18s ease, color .18s ease",
            "&:hover": {
              borderColor: loading ? "divider" : "primary.main",
            },
          }}
        >
          <i
            className="fas fa-sync-alt"
            style={{
              animation: loading
                ? "site-activity-spin .9s linear infinite"
                : "none",
            }}
          />
          <Box
            component="style"
            dangerouslySetInnerHTML={{
              __html:
                "@keyframes site-activity-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}",
            }}
          />
          Refresh
        </ButtonBase>
      </Stack>

      <Box
        sx={{
          position: "relative",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "action.hover",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, var(--mui-palette-primary-main) 50%, transparent)",
            opacity: 0.35,
          }}
        />
        {loading && visibleItems.length === 0 && (
          <Typography
            variant="body2"
            sx={{
              opacity: 0.7,
              p: 3,
              textAlign: "center",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            · Loading ·
          </Typography>
        )}
        {!loading && visibleItems.length === 0 && (
          <Stack alignItems="center" spacing={0.5} sx={{ p: 3 }}>
            <Typography
              variant="overline"
              sx={{
                opacity: 0.5,
                letterSpacing: "0.2em",
              }}
            >
              No signal
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.45, textAlign: "center" }}
            >
              No activity in this window with the current filters.
            </Typography>
          </Stack>
        )}
        {visibleItems.map((item, idx) => (
          <ActivityRow
            key={item.id}
            item={item}
            last={idx === visibleItems.length - 1}
          />
        ))}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
      >
        <ButtonBase
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            color: page === 0 || loading ? "text.disabled" : "text.primary",
            fontSize: "0.75rem",
            fontFamily: "Roboto",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            "&:hover": {
              borderColor:
                page === 0 || loading ? "divider" : "text.primary",
            },
          }}
        >
          <i className="fas fa-chevron-left" />
          Prev
        </ButtonBase>
        <Box
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            minWidth: 86,
            textAlign: "center",
            fontFamily: "RobotoSlab",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.06em",
            fontSize: "0.82rem",
            color: "primary.main",
          }}
        >
          Page {page + 1}
        </Box>
        <ButtonBase
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || loading}
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            color: !hasMore || loading ? "text.disabled" : "text.primary",
            fontSize: "0.75rem",
            fontFamily: "Roboto",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            "&:hover": {
              borderColor:
                !hasMore || loading ? "divider" : "text.primary",
            },
          }}
        >
          Next
          <i className="fas fa-chevron-right" />
        </ButtonBase>
      </Stack>
    </Stack>
  );
}

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { useErrorAlert } from "components/Alerts";
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

export default function LiveFeedTab({ windowKey }) {
  const errorAlert = useErrorAlert();
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

  const category = CATEGORIES[categoryIdx];
  const activeTypes = typesByCat[category.key];

  // Depend on categoryIdx (primitive) rather than `category` (a fresh object
  // reference each render), otherwise useCallback + useEffect re-fire on
  // every render and the feed is stuck in a "Loading…" refetch loop.
  const load = useCallback(() => {
    setLoading(true);
    const cats = CATEGORIES[categoryIdx].serverCategories.join(",");
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
  }, [windowKey, categoryIdx, page]);

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
    <Stack direction="column" spacing={2}>
      <Tabs
        value={categoryIdx}
        onChange={(_, v) => setCategoryIdx(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {CATEGORIES.map((c) => (
          <Tab key={c.key} label={c.label} />
        ))}
      </Tabs>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        {category.types.map((t) => {
          const on = activeTypes.has(t.key);
          return (
            <Chip
              key={t.key}
              label={t.label}
              onClick={() => toggleType(t.key)}
              variant={on ? "filled" : "outlined"}
              color={on ? "primary" : "default"}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          );
        })}
        <Box sx={{ flexGrow: 1 }} />
        <Button
          onClick={load}
          disabled={loading}
          variant="outlined"
          size="small"
          startIcon={<i className="fas fa-sync-alt" />}
        >
          Refresh
        </Button>
      </Stack>

      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {loading && visibleItems.length === 0 && (
          <Typography
            variant="body2"
            sx={{ opacity: 0.7, p: 2, textAlign: "center" }}
          >
            Loading…
          </Typography>
        )}
        {!loading && visibleItems.length === 0 && (
          <Typography
            variant="body2"
            sx={{ opacity: 0.7, p: 2, textAlign: "center" }}
          >
            No activity in this window with the current filters.
          </Typography>
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
        <Button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          size="small"
          variant="outlined"
          startIcon={<i className="fas fa-chevron-left" />}
        >
          Prev
        </Button>
        <Typography variant="body2" sx={{ opacity: 0.7, minWidth: 70, textAlign: "center" }}>
          Page {page + 1}
        </Typography>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore || loading}
          size="small"
          variant="outlined"
          endIcon={<i className="fas fa-chevron-right" />}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}

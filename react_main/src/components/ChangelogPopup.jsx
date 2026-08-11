import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import {
  CHANGELOG_CATEGORIES,
  getLatestChangelogId,
  getUnseenChangelogReleases,
  markChangelogSeen,
  readChangelogSeenId,
} from "data/changelog";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function ReleaseBody({ release }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h3" sx={{ mb: 0.25 }}>
        {release.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {formatDate(release.date)}
      </Typography>
      {CHANGELOG_CATEGORIES.map((cat) => {
        const items = release.categories?.[cat.key];
        if (!items?.length) return null;
        return (
          <Box key={cat.key} sx={{ mb: 1.25 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "primary.main", mb: 0.35 }}
            >
              {cat.label}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
              {items.map((line, i) => (
                <Typography component="li" variant="body2" key={i} sx={{ mb: 0.25 }}>
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * One-time "what's new" dialog on the lobby after a changelog update.
 * Seen state is stored in localStorage (clears with cache / site data).
 */
export default function ChangelogPopup({ enabled = true }) {
  const [open, setOpen] = useState(false);
  const unseen = useMemo(() => {
    if (!enabled || typeof window === "undefined") return [];
    return getUnseenChangelogReleases(readChangelogSeenId());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (unseen.length > 0) {
      setOpen(true);
    }
  }, [enabled, unseen.length]);

  const dismiss = () => {
    const latest = getLatestChangelogId();
    markChangelogSeen(latest);
    setOpen(false);
  };

  if (!enabled || !unseen.length) return null;

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      aria-labelledby="changelog-popup-title"
    >
      <DialogTitle id="changelog-popup-title">
        {unseen.length === 1 ? "What's new" : "What's new since you were last here"}
      </DialogTitle>
      <DialogContent dividers>
        {unseen.map((release, i) => (
          <React.Fragment key={release.id}>
            {i > 0 && <Divider sx={{ my: 1.5 }} />}
            <ReleaseBody release={release} />
          </React.Fragment>
        ))}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Full history:{" "}
          <Link component={RouterLink} to="/policy/changelog" underline="hover">
            Changelog
          </Link>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={dismiss} variant="contained" autoFocus>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}

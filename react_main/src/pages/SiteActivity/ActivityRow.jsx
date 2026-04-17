import React from "react";
import { Link } from "react-router-dom";
import { Box, Stack, Tooltip, Typography } from "@mui/material";

import { NameWithAvatar } from "pages/User/User";

const TYPE_VERBS = {
  comment: "commented on",
  thread: "posted thread",
  forumReply: "replied in",
  setupCreate: "created setup",
  setupEdit: "edited setup",
  pollVote: "voted on",
  stampTrade: "stamp trade",
  trophyAward: "awarded a trophy",
  modAction: "mod action",
  report: "filed a report",
  upvote: "voted on",
  login: "logged in",
  deckCreate: "created a deck",
  avatarChange: "changed avatar",
  nameChange: "changed name",
  settingsChange: "changed settings",
};

const CATEGORY_COLORS = {
  comments: "#b161d3",
  forum: "#d38d61",
  setups: "#61c7d3",
  polls: "#ebd722",
  profile: "#5cb85c",
  mod: "#e45050",
  upvotes: "#7d7d7d",
  logins: "#6c8ef1",
};

function relativeTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// Backend already emits human-readable labels like "Setup: Coco's Epic"
// or "Role: Agent", so no further transformation is needed.
function prettyLabel(item) {
  return item.targetLabel || null;
}

export default function ActivityRow({ item, last }) {
  const verb = TYPE_VERBS[item.type] || item.type;
  const color = CATEGORY_COLORS[item.category] || "#7d7d7d";
  const label = prettyLabel(item);

  const targetEl = label ? (
    item.link ? (
      <Link
        to={item.link}
        style={{ color: "inherit", fontWeight: 600, textDecoration: "underline" }}
      >
        {label}
      </Link>
    ) : (
      <Box component="span" sx={{ fontWeight: 600 }}>
        {label}
      </Box>
    )
  ) : null;

  // Preview only shown as a subtle muted inline extension. Kept short so the
  // row stays a single line; full content viewable via tooltip.
  const inlinePreview =
    item.contentPreview && item.contentPreview.length > 0 ? (
      <Tooltip title={item.contentPreview} placement="top-start">
        <Box
          component="span"
          sx={{
            opacity: 0.6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          — {item.contentPreview}
        </Box>
      </Tooltip>
    ) : null;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        px: 1.25,
        py: 0.75,
        borderBottom: last ? "none" : "1px solid",
        borderColor: "divider",
        "&:hover": { backgroundColor: "rgba(127,127,127,0.06)" },
      }}
    >
      <Box
        sx={{
          width: 3,
          alignSelf: "stretch",
          borderRadius: 2,
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Box sx={{ width: 150, flexShrink: 0, overflow: "hidden" }}>
        {item.actorId ? (
          <NameWithAvatar
            small
            id={item.actorId}
            name={item.actorName}
            avatar={item.actorAvatar}
          />
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            (system)
          </Typography>
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color,
          fontWeight: 700,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {verb}
      </Typography>
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="baseline"
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {targetEl}
        {inlinePreview}
      </Stack>
      <Typography
        variant="caption"
        sx={{
          opacity: 0.6,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {relativeTime(item.timestamp)}
      </Typography>
    </Stack>
  );
}

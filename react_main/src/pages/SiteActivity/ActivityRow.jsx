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
  if (!ts) return { value: "—", unit: "" };
  const diff = Date.now() - ts;
  if (diff < 60_000) return { value: "now", unit: "" };
  if (diff < 3_600_000)
    return { value: String(Math.floor(diff / 60_000)), unit: "m" };
  if (diff < 86_400_000)
    return { value: String(Math.floor(diff / 3_600_000)), unit: "h" };
  return { value: String(Math.floor(diff / 86_400_000)), unit: "d" };
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
  const time = relativeTime(item.timestamp);

  const targetEl = label ? (
    item.link ? (
      <Link
        to={item.link}
        style={{
          color: "inherit",
          fontWeight: 600,
          textDecoration: "none",
          borderBottom: `1px dotted ${color}aa`,
        }}
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
            opacity: 0.55,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            fontStyle: "italic",
          }}
        >
          — {item.contentPreview}
        </Box>
      </Tooltip>
    ) : null;

  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        position: "relative",
        pl: 1.5,
        pr: 1.5,
        py: 0.85,
        borderBottom: last ? "none" : "1px solid",
        borderColor: "divider",
        transition: "background-color .15s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: color,
          transition: "width .18s ease, box-shadow .18s ease",
        },
        "&:hover": {
          backgroundColor: "action.hover",
          "&::before": {
            width: 5,
            boxShadow: `0 0 12px ${color}88`,
          },
        },
      }}
    >
      <Box sx={{ width: 148, flexShrink: 0, overflow: "hidden" }}>
        {item.actorId ? (
          <NameWithAvatar
            small
            id={item.actorId}
            name={item.actorName}
            avatar={item.actorAvatar}
          />
        ) : (
          <Typography
            variant="caption"
            sx={{
              opacity: 0.5,
              fontStyle: "italic",
              letterSpacing: "0.08em",
            }}
          >
            (system)
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          px: 0.85,
          py: 0.25,
          borderRadius: 0.5,
          backgroundColor: `${color}22`,
          color,
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          flexShrink: 0,
          border: `1px solid ${color}33`,
        }}
      >
        {verb}
      </Box>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="baseline"
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          fontSize: "0.88rem",
        }}
      >
        {targetEl}
        {inlinePreview}
      </Stack>
      <Stack
        direction="row"
        spacing={0.25}
        alignItems="baseline"
        sx={{ flexShrink: 0, opacity: 0.75 }}
      >
        <Typography
          sx={{
            fontFamily: "RobotoSlab",
            fontWeight: 700,
            fontSize: "0.82rem",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {time.value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.6,
            fontSize: "0.7rem",
            letterSpacing: "0.04em",
          }}
        >
          {time.unit}
        </Typography>
      </Stack>
    </Stack>
  );
}

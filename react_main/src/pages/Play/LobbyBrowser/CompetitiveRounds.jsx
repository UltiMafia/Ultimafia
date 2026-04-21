import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import { Box, Divider, Stack, Typography } from "@mui/material";

import LobbySidebarPanel from "./LobbySidebarPanel";

function todayUTCDateString() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseUTCDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function startsInParts(dateStr) {
  const start = parseUTCDate(dateStr).getTime();
  const diffMs = start - Date.now();
  if (diffMs <= 0) return { value: "now", unit: "" };
  const hours = diffMs / 3_600_000;
  if (hours < 1) {
    const mins = Math.max(1, Math.ceil(diffMs / 60_000));
    return { value: String(mins), unit: mins === 1 ? "min" : "mins" };
  }
  if (hours < 24) {
    const h = Math.ceil(hours);
    return { value: String(h), unit: h === 1 ? "hr" : "hrs" };
  }
  const days = Math.ceil(hours / 24);
  return { value: String(days), unit: days === 1 ? "day" : "days" };
}

const RAIL_COLOR = {
  ongoing: "error.main",
  upcoming: "primary.main",
  review: "info.main",
};

function StatusBadge({ kind }) {
  if (kind === "ongoing") {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ color: "error.main" }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "error.main",
            animation: "competitive-live-pulse 1.4s ease-in-out infinite",
            "@keyframes competitive-live-pulse": {
              "0%, 100%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.45, transform: "scale(0.75)" },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: "0.12em",
            lineHeight: 1,
          }}
        >
          LIVE
        </Typography>
      </Stack>
    );
  }
  if (kind === "review") {
    return (
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: "0.12em",
          lineHeight: 1,
          color: "info.main",
        }}
      >
        REVIEW
      </Typography>
    );
  }
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        letterSpacing: "0.12em",
        lineHeight: 1,
        color: "primary.main",
      }}
    >
      UPCOMING
    </Typography>
  );
}

function DayProgress({ current, total }) {
  const dots = [];
  for (let i = 1; i <= total; i++) {
    const isPast = i < current;
    const isCurrent = i === current;
    dots.push(
      <Box
        key={i}
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          flexShrink: 0,
          bgcolor: isPast
            ? "text.primary"
            : isCurrent
              ? "error.main"
              : "transparent",
          border: isPast ? "none" : "1px solid",
          borderColor: isCurrent ? "error.main" : "divider",
          boxShadow: isCurrent
            ? "0 0 0 2px rgba(213, 0, 50, 0.18)"
            : "none",
        }}
      />,
    );
  }
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {dots}
    </Stack>
  );
}

function RoundRow({ round }) {
  const { _status: status, _kind: kind } = round;
  const total = (round.currentDay || 0) + (round.remainingOpenDays || 0);
  const showPips =
    kind === "ongoing" && total > 0 && total <= 10 && round.currentDay > 0;

  return (
    <Box
      component={RouterLink}
      to={`/fame/competitive?season=${round.season}&round=${round.number}`}
      sx={{
        position: "relative",
        display: "block",
        textDecoration: "none",
        color: "inherit",
        pl: 1.5,
        py: 1,
        borderLeft: 3,
        borderColor: RAIL_COLOR[kind],
        transition: "background-color 0.18s ease, border-left-width 0.18s ease",
        "&:hover": {
          backgroundColor: "action.hover",
          "& .round-chevron": { opacity: 1, transform: "translateX(0)" },
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ mb: 0.5 }}
      >
        <Typography
          variant="h4"
          sx={{
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          S{round.season}
          <Box
            component="span"
            sx={{ color: "text.secondary", mx: 0.5, fontWeight: 400 }}
          >
            ·
          </Box>
          R{round.number}
        </Typography>
        <StatusBadge kind={kind} />
      </Stack>

      {kind === "ongoing" && showPips && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <DayProgress current={round.currentDay} total={total} />
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1 }}
          >
            Day {round.currentDay}
            <Box component="span" sx={{ mx: 0.5, opacity: 0.5 }}>
              /
            </Box>
            {total}
          </Typography>
        </Stack>
      )}

      {kind === "ongoing" && !showPips && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Day {round.currentDay || "—"}
        </Typography>
      )}

      {kind === "review" && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Reviewing ·{" "}
          <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
            {round.remainingReviewDays}d
          </Box>{" "}
          left
        </Typography>
      )}

      {kind === "upcoming" &&
        (() => {
          const { value, unit } = startsInParts(round.startDate);
          return (
            <Stack direction="row" alignItems="baseline" spacing={0.75}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Starts in
              </Typography>
              <Typography
                sx={{
                  fontFamily: "RobotoSlab",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  color: "primary.main",
                }}
              >
                {value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary" }}
              >
                {unit}
              </Typography>
            </Stack>
          );
        })()}
    </Box>
  );
}

export function CompetitiveRounds() {
  const [rounds, setRounds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/competitive/seasons")
      .then((response) => {
        if (cancelled) return;
        const todayStr = todayUTCDateString();
        const collected = [];
        for (const season of response.data || []) {
          for (const round of season.rounds || []) {
            if (round.number <= 0) continue;
            if (round.completed) continue;
            if (!round.startDate) continue;
            const status =
              round.startDate > todayStr ? "upcoming" : "ongoing";
            let kind = status;
            if (
              status === "ongoing" &&
              round.remainingOpenDays <= 0 &&
              round.remainingReviewDays > 0
            ) {
              kind = "review";
            }
            collected.push({
              ...round,
              season: season.number,
              _status: status,
              _kind: kind,
            });
          }
        }
        const order = { ongoing: 0, review: 1, upcoming: 2 };
        collected.sort((a, b) => {
          if (a._kind !== b._kind) return order[a._kind] - order[b._kind];
          if (a._kind === "upcoming") {
            return a.startDate.localeCompare(b.startDate);
          }
          if (a.season !== b.season) return a.season - b.season;
          return a.number - b.number;
        });
        setRounds(collected);
      })
      .catch(() => {
        if (!cancelled) setRounds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rounds.length) {
    return "";
  }

  return (
    <LobbySidebarPanel title="Competitive Rounds">
      <Stack
        divider={<Divider orientation="horizontal" flexItem />}
        sx={{ mt: 0.5 }}
      >
        {rounds.map((round) => (
          <RoundRow key={`${round.season}-${round.number}`} round={round} />
        ))}
      </Stack>
    </LobbySidebarPanel>
  );
}

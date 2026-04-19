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

function formatStartsIn(dateStr) {
  const start = parseUTCDate(dateStr).getTime();
  const diffMs = start - Date.now();
  if (diffMs <= 0) return "Starts soon";
  const hours = diffMs / 3_600_000;
  if (hours < 1) {
    const mins = Math.max(1, Math.ceil(diffMs / 60_000));
    return `Starts in ${mins} minute${mins === 1 ? "" : "s"}`;
  }
  if (hours < 24) {
    const h = Math.ceil(hours);
    return `Starts in ${h} hour${h === 1 ? "" : "s"}`;
  }
  const days = Math.ceil(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

function describeRoundBody(round, status) {
  const prefix = `S${round.season}R${round.number}`;
  if (status === "upcoming") {
    return `${prefix} · ${formatStartsIn(round.startDate)}`;
  }
  if (round.remainingOpenDays > 0) {
    return `${prefix} · Day ${round.currentDay} · ${round.remainingOpenDays}d left to play`;
  }
  if (round.remainingReviewDays > 0) {
    return `${prefix} · Review phase · ${round.remainingReviewDays}d left`;
  }
  return `${prefix} · Day ${round.currentDay}`;
}

const STATUS_STYLES = {
  ongoing: { label: "ONGOING", color: "error.main" },
  upcoming: { label: "UPCOMING", color: "warning.main" },
};

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
            collected.push({
              ...round,
              season: season.number,
              _status: status,
            });
          }
        }
        collected.sort((a, b) => {
          if (a._status !== b._status) {
            return a._status === "ongoing" ? -1 : 1;
          }
          if (a._status === "ongoing") {
            if (a.season !== b.season) return a.season - b.season;
            return a.number - b.number;
          }
          return a.startDate.localeCompare(b.startDate);
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
      <Stack spacing={0.5} divider={<Divider orientation="horizontal" flexItem />}>
        {rounds.map((round) => {
          const { label, color } = STATUS_STYLES[round._status];
          return (
            <Box
              key={`${round.season}-${round.number}`}
              component={RouterLink}
              to={`/fame/competitive?season=${round.season}&round=${round.number}`}
              sx={{
                pt: 0.5,
                display: "block",
                textDecoration: "none",
                color: "inherit",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              <Typography>
                <Box
                  component="span"
                  sx={{ color, fontWeight: "bold", mr: 0.75 }}
                >
                  {label}
                </Box>
                {describeRoundBody(round, round._status)}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </LobbySidebarPanel>
  );
}

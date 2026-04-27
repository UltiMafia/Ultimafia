import React from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";

export const WINDOWS = [
  { label: "24H", fullLabel: "Last 24 hours", value: "24h" },
  { label: "7D", fullLabel: "Last 7 days", value: "7d" },
  { label: "30D", fullLabel: "Last 30 days", value: "30d" },
];

export function formatSnapshotTime(d) {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} UTC`;
}

export function WindowSegment({ value, onChange }) {
  return (
    <Box
      role="group"
      aria-label="Time window"
      sx={{
        display: "inline-flex",
        p: 0.5,
        borderRadius: 999,
        border: 1,
        borderColor: "divider",
        backgroundColor: "action.hover",
      }}
    >
      {WINDOWS.map((w) => {
        const active = value === w.value;
        return (
          <ButtonBase
            key={w.value}
            onClick={() => onChange(w.value)}
            title={w.fullLabel}
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 999,
              color: active ? "background.default" : "text.primary",
              backgroundColor: active ? "primary.main" : "transparent",
              transition:
                "background-color .18s ease, color .18s ease, box-shadow .18s ease",
              boxShadow: active
                ? (t) => `0 0 10px ${t.palette.primary.main}55`
                : "none",
              fontFamily: "RobotoSlab",
              fontWeight: 700,
              letterSpacing: "0.1em",
              fontSize: "0.82rem",
              fontVariantNumeric: "tabular-nums",
              "&:hover": {
                backgroundColor: active ? "primary.main" : "action.selected",
              },
            }}
          >
            {w.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

export function ActivityHeaderMeta({ snapshotAt }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: "wrap" }}>
      <Typography
        variant="caption"
        sx={{
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "text.secondary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        Snapshot
        <Box component="span" sx={{ mx: 0.75, color: "primary.main", opacity: 0.8 }}>
          ·
        </Box>
        <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
          {formatSnapshotTime(snapshotAt)}
        </Box>
      </Typography>
      <Box sx={{ opacity: 0.3 }}>/</Box>
      <Typography
        variant="caption"
        sx={{
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Fetched on load
      </Typography>
    </Stack>
  );
}

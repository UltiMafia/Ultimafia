import React from "react";
import { Box, Stack } from "@mui/material";
import { UiSegmentedControl, UiText as Typography } from "components/ui";

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
  return <UiSegmentedControl
    ariaLabel="Time window"
    value={value}
    onChange={onChange}
    options={WINDOWS.map((window) => ({ value: window.value, label: window.label, title: window.fullLabel }))}
  />;
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

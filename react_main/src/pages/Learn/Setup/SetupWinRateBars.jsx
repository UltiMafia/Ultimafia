import React from "react";
import { Box, Stack, Typography } from "@mui/material";

import { getAlignmentColor } from "components/Setup";

function colorForKey(key, rolesRaw) {
  if (!key) return "#888";
  if (rolesRaw && rolesRaw[key]) {
    const a = rolesRaw[key].alignment;
    return getAlignmentColor(a);
  }
  return getAlignmentColor(key);
}

/**
 * @param {{ key: string, winRate: number, totalGames: number }[]} rows
 */
export function SetupWinRateBars({ rows, rolesRaw, emptyLabel }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel || "No statistics for this filter yet."}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25} sx={{ width: "100%" }}>
      {rows.map((row) => (
        <Box key={row.key}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
              {row.key}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(row.winRate * 100).toFixed(0)}% · Total: {row.totalGames}
            </Typography>
          </Stack>
          <Box
            sx={{
              width: "100%",
              height: 10,
              borderRadius: 1,
              bgcolor: "action.hover",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${Math.min(100, Math.max(0, row.winRate * 100))}%`,
                height: "100%",
                bgcolor: colorForKey(row.key, rolesRaw),
                borderRadius: 1,
                transition: "width 0.2s ease",
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

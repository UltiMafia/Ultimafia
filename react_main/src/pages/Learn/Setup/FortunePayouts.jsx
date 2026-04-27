import React from "react";
import { Box, Stack, Typography } from "@mui/material";

import { getAlignmentColor } from "components/Setup";

// Maximum a single solo win can pay (matches K and the independent cap on the
// backend). Used purely as the bar's full-width reference — payout values
// themselves come pre-computed from the API.
const MAX_PAYOUT = 120;

/**
 * @param {{
 *   payouts: { faction: string, isMajor: boolean, winrate: number,
 *              hasHistoricalWinrate: boolean, soloPayout: number }[]
 * }} props
 */
export function FortunePayouts({ payouts }) {
  if (!payouts || payouts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No fortune payouts to show — this setup has no recorded ranked or
        competitive games yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25} sx={{ width: "100%" }}>
      {payouts.map((row) => {
        const wrPercent = Math.round(row.winrate * 100);
        const fillPercent = Math.min(100, Math.max(0, (row.soloPayout / MAX_PAYOUT) * 100));
        const color = getAlignmentColor(row.isMajor ? row.faction : "Independent");
        return (
          <Box key={row.faction}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              sx={{ mb: 0.5 }}
            >
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ fontWeight: 600 }}
                >
                  {row.faction}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {wrPercent}% WR
                  {!row.hasHistoricalWinrate && " · default"}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
              >
                {row.soloPayout}
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
                  width: `${fillPercent}%`,
                  height: "100%",
                  bgcolor: color,
                  borderRadius: 1,
                  transition: "width 0.2s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

import React from "react";
import { Box, Stack, Typography } from "@mui/material";


/**
 * @param {{
 *   rows: { key: string, winRate: number, totalGames: number }[],
 *   emptyLabel: string,
 *   payouts: { [factionKey: string]: { soloPayout: number, hasHistoricalWinrate: boolean } }
 * }} props
 *   `payouts` keyed by row.key — when present, a fortune-payout column is
 *   rendered on the right of each row. Pass `undefined`/empty to hide.
 */
export function SetupWinRateBars({ rows, emptyLabel, payouts }) {
  if (!rows || rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel || "No statistics for this filter yet."}
      </Typography>
    );
  }

  const showPayoutColumn =
    !!payouts && Object.keys(payouts).length > 0;

  return (
    <Stack spacing={1.25} sx={{ width: "100%" }}>
      {rows.map((row) => {
        const payout = payouts && payouts[row.key];
        return (
          <Box key={row.key}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              sx={{ mb: 0.5, gap: 2 }}
            >
              <Typography
                variant="body2"
                component="span"
                sx={{ fontWeight: 600 }}
              >
                {row.key}
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="baseline"
                sx={{ flexShrink: 0 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {(row.winRate * 100).toFixed(0)}% · Total: {row.totalGames}
                </Typography>
                {showPayoutColumn && (
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="baseline"
                    sx={{ minWidth: 90, justifyContent: "flex-end" }}
                  >
                    {payout ? (
                      <>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--um-accent)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontWeight: 600,
                          }}
                        >
                          Payout
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "var(--um-accent)",
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {payout.soloPayout}
                          {!payout.hasHistoricalWinrate && (
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{ ml: 0.5, opacity: 0.65, fontWeight: 400 }}
                            >
                              (default)
                            </Typography>
                          )}
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.4 }}
                      >
                        —
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
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
                  bgcolor: "var(--um-accent)",
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

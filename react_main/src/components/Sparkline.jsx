import React, { useMemo } from "react";
import { Box } from "@mui/material";

export default function Sparkline({ history, width = 140, height = 40 }) {
  const padding = useMemo(() => Math.max(2, Math.round(height * 0.1)), [height]);
  const strokeWidth = useMemo(() => Math.max(1.5, height * 0.06), [height]);

  const points = useMemo(() => {
    let prices = Array.isArray(history) ? history : [];
    if (prices.length === 0) prices = [1, 1];
    if (prices.length === 1) prices = [prices[0], prices[0]];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;

    return prices.map((val, idx) => {
      const x = (idx / (prices.length - 1)) * (width - padding * 2) + padding;
      const y = height - (((val - min) / range) * (height - padding * 2) + padding);
      return `${x},${y}`;
    }).join(" ");
  }, [history, width, height, padding]);

  const isUp = useMemo(() => {
    let prices = Array.isArray(history) ? history : [];
    if (prices.length < 2) return true;
    return prices[prices.length - 1] >= prices[prices.length - 2];
  }, [history]);

  const strokeColor = isUp ? "#4caf50" : "#f44336"; // Green vs red

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center" }}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </Box>
  );
}

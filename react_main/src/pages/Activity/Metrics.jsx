import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Stack, Typography } from "@mui/material";
import { UiSection } from "components/ui";

import { useErrorAlert } from "components/Alerts";
import { PieChart } from "pages/Learn/Setup/PieChart";

const COUNTER_DEFS = [
  { key: "gamesHosted", label: "Games hosted" },
  { key: "dau", label: "Active users" },
  { key: "newSignups", label: "New signups" },
  { key: "commentsCreated", label: "Comments" },
  { key: "threadsCreated", label: "Forum threads" },
  { key: "setupsEdited", label: "Setup edits" },
  { key: "reportsFiled", label: "Reports filed" },
  { key: "modActionsTaken", label: "Mod actions" },
];

// Palette pulled from the site's brand / alignment colors so charts feel
// consistent with the rest of Ultimafia. Ordered so the first few slices
// (biggest) get the site's primary reds/golds/blues.
const PALETTE = [
  "#e45050", // ranked red (site primary)
  "#ebd722", // competitive gold
  "#66adff", // village blue
  "#5cb85c", // green
  "#b161d3", // cult purple
  "#d38d61", // warm brown
  "#61c7d3", // cyan
  "#f481c4", // pink
  "#c7ce48", // independent yellow
  "#7d7d7d", // neutral gray
];

function buildColorMap(entries, fixed = {}) {
  const map = { ...fixed };
  let i = 0;
  for (const [label] of entries) {
    if (!map[label]) map[label] = PALETTE[i++ % PALETTE.length];
  }
  return map;
}

function Counter({ def, value }) {
  return (
    <div className="activity-metric">
      <dt>{def.label}</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

function ChartPanel({ title, data, colors, unit = "games" }) {
  const entries = Object.entries(data || {});
  const hasData = entries.length > 0 && entries.some(([, v]) => v > 0);
  // Sort legend entries largest-first so the biggest slice reads first.
  const legendEntries = [...entries].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  return (
    <div className="activity-chart">
      <Stack
        direction="row"
        alignItems="baseline"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="h3"
        >
          {title}
        </Typography>
        {hasData && (
          <Typography
            variant="caption"
            sx={{
              opacity: 0.55,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.04em",
            }}
          >
            · {total} total
          </Typography>
        )}
      </Stack>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        {hasData ? (
          <PieChart
            data={data}
            colors={colors}
            displayPieChart
            labelThreshold={0.1}
            tooltipFn={(label, value) =>
              `${label}: ${value} ${value === 1 ? unit.replace(/s$/, "") : unit}`
            }
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              opacity: 0.5,
              fontStyle: "italic",
              letterSpacing: "0.04em",
            }}
          >
            No data in this window
          </Typography>
        )}
      </Box>
      {hasData && (
        <Stack direction="column" spacing={0.5} sx={{ mt: 2 }}>
          {legendEntries.map(([label, value]) => {
            const pct = total ? Math.round((value / total) * 100) : 0;
            return (
              <Stack
                key={label}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "2px",
                    backgroundColor: colors[label] || "#7d7d7d",
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.82rem",
                  }}
                  title={label}
                >
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.6,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "0.82rem",
                  }}
                >
                  {value}
                  <Box
                    component="span"
                    sx={{ mx: 0.75, opacity: 0.5 }}
                  >
                    ·
                  </Box>
                  {pct}%
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </div>
  );
}

export default function Metrics({ windowKey }) {
  const errorAlert = useErrorAlert();
  const [summary, setSummary] = useState(null);
  const [games, setGames] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setGames(null);
    Promise.all([
      axios.get(`/api/site-activity/summary?window=${windowKey}`),
      axios.get(`/api/site-activity/games?window=${windowKey}`),
    ])
      .then(([sumRes, gamesRes]) => {
        if (cancelled) return;
        setSummary(sumRes.data);
        setGames(gamesRes.data);
      })
      .catch((e) => {
        if (!cancelled) errorAlert(e);
      });
    return () => {
      cancelled = true;
    };
  }, [windowKey]);

  const mafiaData = Object.fromEntries(
    (games?.mafiaGames || []).map((r) => [r.label, r.count])
  );
  const typeData = Object.fromEntries(
    (games?.gameTypes || []).map((r) => [r.label, r.count])
  );
  const topSetupsData = Object.fromEntries(
    (games?.topSetups || []).map((r) => [r.name || "Unnamed", r.count])
  );

  const mafiaColors = {
    competitive: "#ebd722", // gold (matches ranked/comp styling elsewhere)
    ranked: "#e45050",
    unranked: "#7d7d7d",
  };
  const typeColors = buildColorMap(Object.entries(typeData));
  const setupColors = buildColorMap(Object.entries(topSetupsData));

  return (
    <Stack direction="column" spacing={3.5} sx={{ width: "100%", minWidth: 0 }}>
      <UiSection title="Overview">
        <Box
          component="dl"
          className="activity-metrics"
          sx={{
            display: "grid",
            m: 0,
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {COUNTER_DEFS.map((def) => (
            <Counter
              key={def.key}
              def={def}
              value={summary ? summary[def.key] : null}
            />
          ))}
        </Box>
      </UiSection>

      <UiSection title="Game distribution">
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <ChartPanel title="Game types" data={typeData} colors={typeColors} />
          <ChartPanel
            title="Mafia games"
            data={mafiaData}
            colors={mafiaColors}
          />
          <ChartPanel
            title="Top setups"
            data={topSetupsData}
            colors={setupColors}
          />
        </Box>
      </UiSection>
    </Stack>
  );
}

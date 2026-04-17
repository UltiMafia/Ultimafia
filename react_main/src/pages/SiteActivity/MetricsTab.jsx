import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useErrorAlert } from "components/Alerts";
import { PieChart } from "pages/Learn/Setup/PieChart";

const COUNTER_DEFS = [
  { key: "gamesHosted", label: "Games hosted", icon: "fa-gamepad", color: "#6c8ef1" },
  { key: "dau", label: "Active users", icon: "fa-user-clock", color: "#f5a623" },
  { key: "newSignups", label: "New signups", icon: "fa-user-plus", color: "#5cb85c" },
  { key: "commentsCreated", label: "Comments", icon: "fa-comment", color: "#b161d3" },
  { key: "threadsCreated", label: "Forum threads", icon: "fa-comments", color: "#d38d61" },
  { key: "setupsEdited", label: "Setup edits", icon: "fa-sliders-h", color: "#61c7d3" },
  { key: "reportsFiled", label: "Reports filed", icon: "fa-flag", color: "#e45050" },
  { key: "modActionsTaken", label: "Mod actions", icon: "fa-gavel", color: "#7d7d7d" },
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
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const bgAlpha = isLight ? "22" : "14";
  const borderAlpha = isLight ? "77" : "40";
  const iconBgAlpha = isLight ? "33" : "26";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: `${def.color}${bgAlpha}`,
        border: `1px solid ${def.color}${borderAlpha}`,
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${def.color}${iconBgAlpha}`,
          flexShrink: 0,
        }}
      >
        <i
          className={`fas ${def.icon}`}
          style={{ color: def.color, fontSize: "1.2rem" }}
        />
      </Box>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            opacity: 0.65,
            lineHeight: 1.2,
          }}
        >
          {def.label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {value ?? "—"}
        </Typography>
      </Stack>
    </Box>
  );
}

function ChartPanel({ title, data, colors, unit = "games" }) {
  const entries = Object.entries(data || {});
  const hasData = entries.length > 0 && entries.some(([, v]) => v > 0);
  // Sort legend entries largest-first so the biggest slice reads first.
  const legendEntries = [...entries].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="overline"
        sx={{ letterSpacing: "0.12em", opacity: 0.7 }}
      >
        {title}
      </Typography>
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
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            No data in this window.
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
                    width: 12,
                    height: 12,
                    borderRadius: "3px",
                    backgroundColor: colors[label] || "#7d7d7d",
                    border: "1px solid rgba(0,0,0,0.6)",
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
                  }}
                  title={label}
                >
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.7, whiteSpace: "nowrap" }}
                >
                  {value} · {pct}%
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

export default function MetricsTab({ windowKey }) {
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
    <Stack direction="column" spacing={3} sx={{ width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
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

      <Box
        sx={{
          display: "grid",
          gap: 2,
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
    </Stack>
  );
}

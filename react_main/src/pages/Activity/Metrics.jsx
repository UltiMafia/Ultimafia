import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Stack, Typography } from "@mui/material";

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

function SectionEyebrow({ label, count }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ mb: 1.5 }}
    >
      <Box
        sx={{
          width: 16,
          height: 2,
          backgroundColor: "primary.main",
          opacity: 0.7,
        }}
      />
      <Typography
        variant="overline"
        sx={{
          letterSpacing: "0.2em",
          color: "primary.main",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
      {typeof count === "number" && (
        <Typography
          variant="caption"
          sx={{
            opacity: 0.55,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.06em",
          }}
        >
          · {count}
        </Typography>
      )}
      <Box
        sx={{
          flex: 1,
          height: 1,
          backgroundColor: "divider",
          opacity: 0.5,
        }}
      />
    </Stack>
  );
}

function Counter({ def, value }) {
  return (
    <Box
      sx={{
        position: "relative",
        px: 2,
        pt: 2.25,
        pb: 1.75,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "action.hover",
        overflow: "hidden",
        transition:
          "border-color .18s ease, transform .18s ease, box-shadow .18s ease",
        "&:hover": {
          borderColor: def.color,
          transform: "translateY(-2px)",
          boxShadow: `0 4px 16px -6px ${def.color}66`,
          "& .counter-icon": { opacity: 0.35, transform: "scale(1.04)" },
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${def.color}, ${def.color}22)`,
        }}
      />
      <Box
        aria-hidden
        className="counter-icon"
        sx={{
          position: "absolute",
          top: 12,
          right: 14,
          opacity: 0.18,
          color: def.color,
          fontSize: "2.1rem",
          lineHeight: 1,
          transition: "opacity .18s ease, transform .18s ease",
        }}
      >
        <i className={`fas ${def.icon}`} />
      </Box>
      <Typography
        variant="overline"
        sx={{
          letterSpacing: "0.16em",
          opacity: 0.85,
          color: def.color,
          fontWeight: 700,
          lineHeight: 1,
          display: "block",
          mb: 0.75,
        }}
      >
        {def.label}
      </Typography>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
          lineHeight: 1.02,
          fontSize: { xs: "2rem", md: "2.3rem" },
        }}
      >
        {value ?? "—"}
      </Typography>
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
        position: "relative",
        pt: 2.25,
        pb: 2,
        px: 2,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "action.hover",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, var(--mui-palette-primary-main) 50%, transparent)",
          opacity: 0.45,
        }}
      />
      <Stack
        direction="row"
        alignItems="baseline"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: "0.2em",
            color: "primary.main",
            fontWeight: 700,
            lineHeight: 1,
          }}
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
    </Box>
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
      <Box>
        <SectionEyebrow label="Pulse" />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
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
      </Box>

      <Box>
        <SectionEyebrow label="Distribution" />
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
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
      </Box>
    </Stack>
  );
}

import React, { useContext, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  ButtonBase,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import MetricsTab from "./MetricsTab";
import LiveFeedTab from "./LiveFeedTab";

const WINDOWS = [
  { label: "24H", fullLabel: "Last 24 hours", value: "24h" },
  { label: "7D", fullLabel: "Last 7 days", value: "7d" },
  { label: "30D", fullLabel: "Last 30 days", value: "30d" },
];

function formatSnapshotTime(d) {
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} UTC`;
}

function WindowSegment({ value, onChange }) {
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
                backgroundColor: active
                  ? "primary.main"
                  : "action.selected",
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

export default function SiteActivityPage() {
  const user = useContext(UserContext);
  const [tab, setTab] = useState(0);
  const [windowKey, setWindowKey] = useState("24h");
  const snapshotAt = useMemo(() => new Date(), [windowKey]);

  if (!user.loaded) return null;
  if (!user.loggedIn || !user.perms?.viewSiteActivity)
    return <Navigate to="/play" replace />;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "60vh",
        position: "relative",
        overflow: "hidden",
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
          background:
            "linear-gradient(90deg, transparent 0%, var(--mui-palette-primary-main) 20%, var(--mui-palette-primary-main) 80%, transparent 100%)",
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "flex-end" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 0.75 }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "primary.main",
                boxShadow: (t) => `0 0 8px ${t.palette.primary.main}`,
                animation: "site-activity-signal 2s ease-in-out infinite",
                "@keyframes site-activity-signal": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.4, transform: "scale(0.82)" },
                },
              }}
            />
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.24em",
                color: "primary.main",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              Moderator Console
            </Typography>
          </Stack>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.01em",
              lineHeight: 1.02,
              fontSize: { xs: "2.1rem", md: "2.75rem" },
            }}
          >
            Site Activity
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 1, flexWrap: "wrap" }}
          >
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
              <Box
                component="span"
                sx={{ mx: 0.75, color: "primary.main", opacity: 0.8 }}
              >
                ·
              </Box>
              <Box
                component="span"
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
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
        </Box>

        <WindowSegment value={windowKey} onChange={setWindowKey} />
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            fontFamily: "RobotoSlab",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontSize: "0.78rem",
            minHeight: 42,
            px: 0,
            mr: 4,
            transition: "color .18s ease",
          },
          "& .MuiTab-root.Mui-selected": {
            color: "primary.main",
          },
          "& .MuiTabs-indicator": {
            height: 3,
            backgroundColor: "primary.main",
            boxShadow: (t) => `0 0 8px ${t.palette.primary.main}88`,
          },
        }}
      >
        <Tab label="Metrics" />
        <Tab label="Live Feed" />
      </Tabs>

      {tab === 0 && <MetricsTab windowKey={windowKey} />}
      {tab === 1 && <LiveFeedTab windowKey={windowKey} />}
    </Paper>
  );
}

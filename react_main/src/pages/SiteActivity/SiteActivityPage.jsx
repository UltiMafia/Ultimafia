import React, { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import MetricsTab from "./MetricsTab";
import LiveFeedTab from "./LiveFeedTab";

const WINDOWS = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

export default function SiteActivityPage() {
  const user = useContext(UserContext);
  const [tab, setTab] = useState(0);
  const [windowKey, setWindowKey] = useState("24h");

  if (!user.loaded) return null;
  if (!user.loggedIn || !user.perms?.viewSiteActivity)
    return <Navigate to="/play" replace />;

  return (
    <Paper sx={{ p: 2, minHeight: "60vh" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Site Activity
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Site-wide health metrics and recent actions
          </Typography>
        </Box>
        <Select
          value={windowKey}
          onChange={(e) => setWindowKey(e.target.value)}
          size="small"
          sx={{ minWidth: 180, borderRadius: 999 }}
        >
          {WINDOWS.map((w) => (
            <MenuItem key={w.value} value={w.value}>
              {w.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab label="Metrics" />
        <Tab label="Live Feed" />
      </Tabs>

      {tab === 0 && <MetricsTab windowKey={windowKey} />}
      {tab === 1 && <LiveFeedTab windowKey={windowKey} />}
    </Paper>
  );
}

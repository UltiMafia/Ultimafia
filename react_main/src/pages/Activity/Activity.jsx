import React, { useContext, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  Box,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { UserContext } from "Contexts";
import Metrics from "./Metrics";
import LiveFeed from "./LiveFeed";
import { ActivityHeaderMeta, WindowSegment } from "./WindowFilterControls";

export default function SiteActivityPage() {
  const user = useContext(UserContext);
  const [windowKey, setWindowKey] = useState("24h");
  const snapshotAt = useMemo(() => new Date(), [windowKey]);

  if (!user.loaded) return null;
  if (!user.loggedIn)
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
          </Stack>
          <Typography
            variant="h3"
          >
            Site Activity
          </Typography>
          <ActivityHeaderMeta snapshotAt={snapshotAt} />
        </Box>

        <WindowSegment value={windowKey} onChange={setWindowKey} />
      </Stack>
      <Routes>
        <Route path="/" element={<Navigate to="metrics" replace />} />
        <Route path="metrics" element={<Metrics windowKey={windowKey} />} />
        <Route path="livefeed" element={<LiveFeed windowKey={windowKey} />} />
        <Route path="*" element={<Navigate to="metrics" replace />} />
      </Routes>
    </Paper>
  );
}

// Real StrategiesPanel / StrategiesSection / floating-window layer, with the
// strategy API answered from fixtures. Open with ?mode=desktop (default) or
// ?mode=mobile; the runner (test/run-strategy-windows.cjs) drives both.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import axios from "axios";

import { StrategiesPanel, StrategiesSection } from "../src/components/Strategies";
import { StrategyWindowsProvider } from "../src/components/strategyWindows/StrategyWindowsContext";
import FloatingStrategyWindows from "../src/components/strategyWindows/FloatingStrategyWindows";
import { SiteInfoContext, UserContext } from "../src/Contexts";

function guide(id, title, content, minutesAgo) {
  return {
    id,
    title,
    content,
    createdAt: 1700000000000 - minutesAgo * 60000,
    updatedAt: 1700000000000 - minutesAgo * 60000,
    voteCount: 0,
    deleted: false,
    author: { id: "author-1", name: "Anchor", groups: [] },
  };
}

const FIXTURES = {
  setupOpen: [
    guide("guide-open-1", "Vote on day one", "Never skip the first vote. **Pressure** wins games.", 3),
    guide("guide-open-2", "Keep a claim sheet", "Write down every claim, then check them against the deaths.", 2),
  ],
  setupRandom: [
    guide("guide-random-1", "Random setups reward volume", "Talk early; the info is in who talks to whom.", 1),
  ],
  // Enough guides that the Info tab has to scroll on a phone.
  setupMobile: Array.from({ length: 8 }, (_, index) =>
    guide(
      `guide-mobile-${index + 1}`,
      `Info tab guide ${index + 1}`,
      `Body of guide ${index + 1}. Read it while the game runs.`,
      index
    )
  ),
};

// No backend: the guide list comes from the fixtures above.
axios.defaults.adapter = (config) => {
  const setupId = config.params && config.params.setupId;
  const data = FIXTURES[setupId] || [];
  return Promise.resolve({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
};

const user = {
  loaded: true,
  loggedIn: true,
  id: "me",
  name: "Me",
  perms: { postReply: true, vote: true, viewDeleted: false },
  settings: {},
  autoContrastColor: (color) => color,
};
const siteInfo = { showAlert: () => {}, hideAllAlerts: () => {} };

const mode = new URLSearchParams(window.location.search).get("mode") || "desktop";

function DesktopRig() {
  return (
    <Stack direction="row" spacing={2} sx={{ p: 2, alignItems: "flex-start" }}>
      <Box sx={{ width: 340 }} data-testid="panel-open">
        <StrategiesPanel setupId="setupOpen" title="Open Roles 12P" />
      </Box>
      <Box sx={{ width: 340 }} data-testid="panel-random">
        <StrategiesPanel setupId="setupRandom" title="Random 15P" />
      </Box>
      <Typography variant="caption" sx={{ opacity: 0.6 }}>
        The pop-out buttons open a draggable, resizable guide window.
      </Typography>
    </Stack>
  );
}

// The container the game's Info tab gives its content on a phone.
function MobileRig() {
  return (
    <Box
      sx={{
        width: 390,
        height: 700,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
      data-testid="phone"
    >
      <div style={{ height: 64, background: "#333", color: "#fff", padding: 8 }}>
        TopBar stand-in
      </div>
      <Box
        data-testid="info-tab"
        sx={{
          display: "flex",
          flex: "1",
          minHeight: 0,
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <StrategiesSection
          setupId="setupMobile"
          title="Open Roles 12P"
          variant="fill"
        />
      </Box>
    </Box>
  );
}

const root = document.createElement("div");
document.body.append(root);

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <CssBaseline />
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={siteInfo}>
          <StrategyWindowsProvider>
            {mode === "mobile" ? <MobileRig /> : <DesktopRig />}
            <FloatingStrategyWindows />
          </StrategyWindowsProvider>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__strategyWindowsReady = true),
);

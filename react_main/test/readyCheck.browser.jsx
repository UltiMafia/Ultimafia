import React from "react";
import ReactDOM from "react-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import ReadyCheckDialog from "../src/pages/Game/components/ReadyCheck";
import { getSiteTheme } from "../src/constants/themes";
import "../src/css/main.css";

// Fixture for the ready check dialog: the real component, the site's real
// theme and scheme variables, and stub callbacks that record what the dialog
// asked the game to do. ?mode=light switches the light scheme, ?spectate=0
// drops the optional spectate action the way a no-spectate lobby does.
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") === "light" ? "light" : "dark";
const withSpectate = params.get("spectate") !== "0";

document.documentElement.classList.add(mode === "light" ? "light-mode" : "dark-mode");

const theme = getSiteTheme(undefined, mode);

window.__calls = [];
const record = (name) => () => window.__calls.push(name);

function Fixture() {
  return (
    <ThemeProvider theme={theme} mode={mode} noSsr>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ReadyCheckDialog
          open
          endTime={Date.now() + 28000}
          timeLeft={28000}
          onReady={record("ready")}
          onLeave={record("leave")}
          onSpectate={withSpectate ? record("spectate") : undefined}
        />
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<Fixture />, document.getElementById("root"), () => {
  window.__ready = true;
});

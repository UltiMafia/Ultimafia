// Fixture for test/run-fingerprint-gate.cjs: the real login gate dialog in the
// site's own light and dark palettes, so both themes are checked from tokens
// rather than from a hand-made palette.
//
//   ?mode=light|dark (default dark)
import React from "react";
import ReactDOM from "react-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { FingerprintBlockedDialog } from "../src/components/FingerprintBlockedDialog";
import { getSiteTheme } from "../src/constants/themes";
import "../src/css/main.css";

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") === "light" ? "light" : "dark";
// The site's palette is class-driven (see src/css/main.css), and the theme's
// surfaces read those CSS variables, so the fixture sets the class the app sets.
document.documentElement.classList.remove("light-mode", "dark-mode");
document.documentElement.classList.add(mode === "light" ? "light-mode" : "dark-mode");

const theme = getSiteTheme(null, mode, "default");

ReactDOM.render(
  <ThemeProvider theme={theme} noSsr defaultMode={mode}>
    <CssBaseline />
    <div
      data-mode={mode}
      style={{
        minHeight: "100vh",
        background: theme.palette.background.default,
        padding: 24,
      }}
    >
      <FingerprintBlockedDialog open onClose={() => {}} />
    </div>
  </ThemeProvider>,
  document.getElementById("root")
);

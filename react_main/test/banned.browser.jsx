// Test page for test/run-banned.cjs: the real ban page, with /api/auth/ban
// answered by the runner.
import React from "react";
import ReactDOM from "react-dom";
import { createTheme, ThemeProvider } from "@mui/material";
import Banned from "../src/pages/Banned/Banned";

const theme = createTheme({ palette: { mode: "dark" } });

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <Banned />
  </ThemeProvider>,
  document.getElementById("root"),
);
window.__bannedReady = true;

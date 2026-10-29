// Test page for test/run-ban-appeals.cjs: the real Ban Appeals page under
// its routes, with /api/mod/banAppeals answered by the runner.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createTheme, Paper, ThemeProvider } from "@mui/material";
import BanAppeals from "../src/pages/Policy/Moderation/BanAppeals";

const theme = createTheme({ palette: { mode: "dark" } });

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      <Paper sx={{ p: 2, m: 2, maxWidth: 1100 }}>
        <Routes>
          <Route path="/policy/moderation/ban-appeals" element={<BanAppeals />} />
          <Route path="/policy/moderation/ban-appeals/:appealId" element={<BanAppeals />} />
        </Routes>
      </Paper>
    </BrowserRouter>
  </ThemeProvider>,
  document.getElementById("root"),
);
window.__banAppealsReady = true;

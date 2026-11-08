import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, ThemeProvider } from "@mui/material";
import { getSiteTheme } from "../src/constants/themes";

import { UserContext } from "../src/Contexts";
import { TutorialLobbyBanner } from "../src/components/TutorialPrompt";

// Fixture for the new-account tutorial prompt banner (TutorialLobbyBanner).
// ?theme=light|dark sets the site palette the way the app does: a class on
// <html> plus the MUI palette mode.
const params = new URLSearchParams(window.location.search);
const mode = params.get("theme") === "dark" ? "dark" : "light";

document.documentElement.classList.add(`${mode}-mode`);
if (mode === "dark") document.body.classList.add("dark-mode");

// The site palette drives surfaces and primary colour (yellow in dark).
const theme = getSiteTheme(undefined, mode);

// The real component reads both of these: eligibility from the user, and the
// dismissal flag from localStorage.
localStorage.removeItem("tutorialBannerDismissed");
const user = { loggedIn: true, tutorialPrompt: true, name: "NewPlayer" };

const root =
  document.getElementById("root") ||
  document.body.appendChild(document.createElement("div"));

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme} defaultMode={mode}>
      <UserContext.Provider value={user}>
        <Box sx={{ p: 1.5, maxWidth: 760, bgcolor: "background.default" }}>
          <TutorialLobbyBanner />
        </Box>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root
);

window.__ready = true;

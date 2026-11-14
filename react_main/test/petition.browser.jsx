// Test page for test/run-text-size.cjs: the real forum Thread with a petition,
// opened as petition.html. The runner answers /api/forums/thread/* on loopback.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material";
import Thread from "../src/pages/Community/Forums/Thread";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";
import "../src/css/forums.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = {
  id: "me",
  name: "Tester",
  loggedIn: true,
  settings: {},
  perms: {},
  autoContrastColor: (color) => color,
};

const root = document.createElement("div");
root.id = "root";
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <SiteInfoContext.Provider value={{ showAlert: (m) => (window.__alerts = [...(window.__alerts || []), String(m)]), emotes: {} }}>
        <UserContext.Provider value={user}>
          <div className="inner-content">
            <Routes>
              <Route path="*" element={<Thread updateForumNavInfo={() => {}} />} />
            </Routes>
          </div>
        </UserContext.Provider>
      </SiteInfoContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__fixtureReady = true),
);

// Test page for test/run-text-size.cjs: the real StatsQueryView from the
// Profile ratings panel, inside .profile .ratings so user.css applies. The
// runner answers /api/setup/* on loopback with a setup name.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material";
import { StatsQueryView } from "../src/pages/User/Profile";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";
import "../src/css/user.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = {
  id: "me",
  name: "Tester",
  loggedIn: true,
  settings: {},
  perms: {},
  autoContrastColor: (color) => color,
};
const row = { totalGames: 40, wins: { count: 22, total: 36 }, abandons: { count: 4, total: 40 } };
const stats = {
  Mafia: {
    all: {
      bySetup: { s1: row },
      byRole: { Villager: row },
      byAlignment: { Village: row },
    },
    unranked: {},
  },
};

const root = document.createElement("div");
root.id = "root";
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <SiteInfoContext.Provider value={{ showAlert: () => {}, emotes: {} }}>
        <UserContext.Provider value={user}>
          <div className="profile" style={{ padding: 8 }}>
            <div className="box-panel ratings">
              <StatsQueryView stats={stats} statsBucket="ranked" />
            </div>
          </div>
        </UserContext.Provider>
      </SiteInfoContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__fixtureReady = true),
);

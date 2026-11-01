// Browser fixture for test/run-mobile-header.cjs: the real phone header with a
// logged-in user, the DM button, hearts and avatar. Reports the measured
// widths so the runner can assert the row fits the viewport at phone widths.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Header } from "../src/Main";
import { getSiteTheme } from "../src/constants/themes";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";

const theme = getSiteTheme();
const user = {
  id: "test-user",
  name: "TestUser",
  loggedIn: true,
  avatar: false,
  vanityUrl: null,
  redHearts: 15,
  goldHearts: 0,
  groups: [],
  perms: {},
  settings: {},
  autoContrastColor: (c) => c,
  clear() {},
  setInGame() {},
};
const siteInfo = { cacheVal: 1, showAlert() {} };

function Fixture() {
  return (
    <ThemeProvider theme={theme} noSsr defaultMode="dark">
      <CssBaseline />
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={siteInfo}>
          <BrowserRouter>
            <Header setShowAnnouncementTemporarily={() => {}} />
          </BrowserRouter>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

ReactDOM.render(<Fixture />, document.getElementById("root"), () => {
  window.__ready = true;
});

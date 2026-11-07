// Test page for test/run-text-size.cjs: the real DeckSelector inside the Play
// page wrapper, so play.css applies to its Featured / Popular / Yours links.
// The runner answers /api/deck/* on loopback with an empty list.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material";
import DeckSelector from "../src/pages/Play/Decks/DeckSelector";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = { id: "me", name: "Tester", loggedIn: true, settings: {}, perms: {} };

const root = document.createElement("div");
root.id = "root";
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <SiteInfoContext.Provider value={{ showAlert: () => {}, emotes: {} }}>
        <UserContext.Provider value={user}>
          <div className="inner-content play">
            <DeckSelector />
          </div>
        </UserContext.Provider>
      </SiteInfoContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__fixtureReady = true),
);

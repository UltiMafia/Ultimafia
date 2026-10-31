// Test page for test/run-in-game-warning.cjs: the real in-game warning at the
// end of a long page, inside a frame laid out like the app shell on phones
// (fixed frame, scrolling content, bottom navigation), so the last row can be
// checked for staying clear of the warning. window.__setInGame toggles it.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, Button, createTheme, Stack, ThemeProvider } from "@mui/material";
import { InGameWarning } from "../src/Main";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";

const theme = createTheme({ palette: { mode: "dark" } });

function Fixture() {
  const [inGame, setInGame] = useState(null);
  window.__setInGame = setInGame;
  const user = { id: "tester", loggedIn: true, settings: {}, inGame, setInGame };
  const rows = [];
  for (let i = 1; i <= 30; i++)
    rows.push(
      <Box key={i} sx={{ height: 48, bgcolor: "action.hover" }}>
        Reply {i}
      </Box>,
    );
  return (
    <UserContext.Provider value={user}>
      <Stack
        sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
      >
        <Stack
          direction="row"
          className="site-wrapper"
          sx={{ flex: "1", justifyContent: "center", overflowY: "auto", minHeight: 0 }}
        >
          <Stack direction="column" spacing={1} sx={{ px: 1, py: 1, width: "1080px", maxWidth: "100%" }}>
            {rows}
            <Stack data-testid="last" direction="row" spacing={1}>
              <Button variant="outlined">Previous page</Button>
              <Button variant="outlined">Next page</Button>
            </Stack>
            <InGameWarning />
          </Stack>
        </Stack>
        <Box sx={{ height: 56, flexShrink: 0, bgcolor: "background.default" }} />
      </Stack>
    </UserContext.Provider>
  );
}

const root = document.createElement("div");
root.id = "root";
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <SiteInfoContext.Provider value={{ showAlert: () => {} }}>
        <Fixture />
      </SiteInfoContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__inGameWarningReady = true),
);

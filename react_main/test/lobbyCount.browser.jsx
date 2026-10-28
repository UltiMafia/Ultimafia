// Real PlayerCount, popover and sheet; the runner supplies /info responses.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { PlayerCount } from "../src/pages/Play/LobbyBrowser/PlayerCount";
import { SheetProvider } from "../src/components/Sheet";
import { SiteInfoContext, UserContext } from "../src/Contexts";

const cases = [
  { id: "finished", status: "Finished", players: 0 },
  { id: "finished-with-players", status: "Finished", players: 7 },
  { id: "empty", status: "Open", players: 0 },
  { id: "partial", status: "Open", players: 3 },
  { id: "full", status: "In Progress", players: 7 },
];
const root = document.createElement("div");
document.body.append(root);
Object.assign(document.body.style, {
  background: "#3a2931",
  color: "white",
  margin: "24px",
});

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <CssBaseline />
      <UserContext.Provider value={{ settings: {}, autoContrastColor: color => color }}>
        <SiteInfoContext.Provider value={{ showAlert: () => {} }}>
          <SheetProvider>
            {cases.map(({ id, status, players }) => (
              <div key={id} data-case={id} style={{ marginBottom: 20 }}>
                <PlayerCount
                  game={{ setup: { total: 7 }, endTime: Date.now() - 420000 }}
                  gameId={id}
                  status={status}
                  numSlotsTaken={players}
                  spectatingAllowed
                  spectatorCount={2}
                />
              </div>
            ))}
          </SheetProvider>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__lobbyCountReady = true),
);

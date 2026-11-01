// Browser fixture for test/run-lobby-spectate.cjs: the real lobby row buttons.
// Spectate and Join must navigate client-side (no document reload) and carry
// the requested role for the hosted game session to apply over its socket.
import React from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { GameStatus } from "../src/pages/Play/LobbyBrowser/GameRow";
import { useHostedGameSession } from "../src/hooks/useHostedGameSession";
import { SheetProvider } from "../src/components/Sheet";
import { SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = {
  loggedIn: true,
  settings: {},
  autoContrastColor: (color) => color,
};
const siteInfo = { cacheVal: 1, showAlert() {} };
const game = {
  id: "g1",
  status: "Open",
  players: 3,
  spectating: true,
  spectatorCount: 1,
  broken: false,
  private: false,
  ranked: false,
  competitive: false,
  setup: { id: "setup-1", total: 8 },
  lobby: "Main",
  endTime: 0,
  gameState: "Pregame",
  winnersInfo: { groups: [] },
};

function GamePage() {
  const location = useLocation();
  const { hostedGameId, leaveGameSession } = useHostedGameSession();
  return (
    <div>
      <div data-testid="game-page">
        {location.pathname}
        {location.search}
        {"|role="}
        {location.state?.requestedMembership || ""}
      </div>
      <div data-testid="session">{hostedGameId || ""}</div>
      <button onClick={leaveGameSession}>Leave</button>
    </div>
  );
}

function LobbyPage() {
  return (
    <div>
      <GameStatus game={game} status={game.status} showGameState={false} />
    </div>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme} noSsr defaultMode="dark">
      <CssBaseline />
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={siteInfo}>
          <SheetProvider>
            <Routes>
              <Route path="/play" element={<LobbyPage />} />
              <Route path="/game/:gameId" element={<GamePage />} />
            </Routes>
          </SheetProvider>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  document.getElementById("root"),
  () => {
    window.__lobbySpectateReady = true;
  }
);

// Test page for test/run-settings-menu.cjs: the real desktop game layout with
// PlayerList and the Settings menu in the left panel, hosted in a fixed,
// viewport-sized .game-session box like the app shell does, so the expanded
// Settings form's Save button can be checked for being reachable.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, createTheme, Stack, ThemeProvider } from "@mui/material";
import {
  GameTypeContext,
  PlayerList,
  SettingsMenu,
  ThreePanelLayout,
} from "../src/pages/Game/Game";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";
import "../src/css/game.css";

const theme = createTheme({ palette: { mode: "dark" } });
const user = { id: "tester", loggedIn: true, settings: {} };

function makeGame(selectedPanel, setSelectedPanel) {
  const state = {
    name: "Day 1",
    meetings: {},
    alerts: [],
    dead: {},
    exorcised: {},
  };
  return {
    gameId: "fixture",
    gameType: "Mafia",
    review: false,
    history: { currentState: 1, states: { 1: state } },
    stateViewing: 1,
    updateHistory: () => {},
    isSpectator: false,
    options: { spectating: true },
    players: {},
    spectators: [],
    settings: {},
    updateSettings: () => {},
    filters: {},
    setup: { total: 12 },
    spectatorCount: 0,
    socket: { on: () => {}, send: () => {} },
    selectedPanel,
    setSelectedPanel,
    onLeaveGameClick: () => {},
    setChangeSetupDialogOpen: () => {},
    kudos: null,
  };
}

function Fixture() {
  const [selectedPanel, setSelectedPanel] = useState("chat");
  const game = makeGame(selectedPanel, setSelectedPanel);
  return (
    <GameContext.Provider value={game}>
      <GameTypeContext.Provider value={{ singleState: false }}>
        <div className="game-session">
          <Stack direction="column" sx={{ height: "100%" }}>
            <Box className="game" sx={{ backgroundColor: "background.paper" }}>
              <ThreePanelLayout
                leftPanelContent={
                  <>
                    <PlayerList />
                    <SettingsMenu />
                  </>
                }
                centerPanelContent={<div data-testid="chat">Chat</div>}
                rightPanelContent={<div data-testid="info">Info</div>}
              />
            </Box>
          </Stack>
        </div>
      </GameTypeContext.Provider>
    </GameContext.Provider>
  );
}

const root = document.createElement("div");
root.id = "root";
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={{ showAlert: () => {} }}>
          <Fixture />
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__settingsMenuReady = true),
);

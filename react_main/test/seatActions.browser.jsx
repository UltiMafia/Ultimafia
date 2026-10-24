// Test page for test/run-seat-actions.cjs: the real game layouts (desktop
// three-panel and phone) with the real TextMeetingLayout chat, hosted in a
// fixed, viewport-sized .game-session box like the app shell does, so the
// pregame "Spectate" / "Join open seat" button can be checked for being on
// screen. ?case=seated|spectator|started|review|nospectating picks the state;
// &legacy=1 renders the button after the game Stack instead, as it used to be
// on desktop, to show the check catches that placement.
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, createTheme, Stack, ThemeProvider } from "@mui/material";
import {
  GameTypeContext,
  MobileLayout,
  PregameSeatActions,
  TextMeetingLayout,
  ThreePanelLayout,
} from "../src/pages/Game/Game";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";
import "../src/css/game.css";

const params = new URLSearchParams(window.location.search);
const testCase = params.get("case") || "seated";
const legacy = params.get("legacy") === "1";

const theme = createTheme({ palette: { mode: "dark" } });
const user = { id: "tester", loggedIn: true, settings: {} };
window.__sent = [];

function makeGame(selectedPanel, setSelectedPanel) {
  const started = testCase === "started";
  const pregameState = { name: "Pregame", meetings: {}, alerts: [] };
  const states = { [-1]: pregameState };
  if (started) states[1] = { name: "Day 1", meetings: {}, alerts: [] };
  return {
    gameId: "fixture",
    review: testCase === "review",
    history: { currentState: started ? 1 : -1, states },
    stateViewing: started ? 1 : -1,
    updateHistory: () => {},
    isSpectator: testCase === "spectator",
    options: { spectating: testCase !== "nospectating" },
    players: {},
    spectators: [],
    settings: {},
    filters: {},
    socket: { on: () => {}, send: (...args) => window.__sent.push(args) },
    selectedPanel,
    setSelectedPanel,
    onLeaveGameClick: () => {},
    kudos: null,
  };
}

function Fixture() {
  const [selectedPanel, setSelectedPanel] = useState("chat");
  const game = makeGame(selectedPanel, setSelectedPanel);
  const chat = <TextMeetingLayout seatActions={!legacy} />;
  return (
    <GameContext.Provider value={game}>
      <GameTypeContext.Provider value={{ singleState: false }}>
        <div className="game-session">
          <Stack direction="column" sx={{ height: "100%" }}>
            <Box className="game" sx={{ backgroundColor: "background.paper" }}>
              <ThreePanelLayout
                leftPanelContent={<div data-testid="players">Players</div>}
                centerPanelContent={chat}
                rightPanelContent={<div data-testid="info">Info</div>}
              />
              <MobileLayout
                outerLeftContent={<div>Players</div>}
                centerContent={chat}
                innerRightContent={<div>Actions</div>}
              />
            </Box>
          </Stack>
          {legacy && <PregameSeatActions />}
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
  () => (window.__seatActionsReady = true),
);

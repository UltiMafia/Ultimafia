// Browser fixture for test/run-speech-filters.cjs: the real SpeechFilter panel
// and the real TextMeetingLayout transcript, in both the full-DOM and the
// windowed (virtualized) renderer.
//
// Query: windowed=1 (settings.virtualizeTranscript), size=<messages>,
// pregame=1 (state -1), active=0 (retained session), singleState=1.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import {
  GameTypeContext,
  IsPhoneDeviceContext,
  SpeechFilter,
  TextMeetingLayout,
} from "../src/pages/Game/Game";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import { getSiteTheme } from "../src/constants/themes";
import { filterProfanity } from "../src/components/Basic";
import { slurs } from "../src/constants/filteredStrings";
import "../src/css/main.css";
import "../src/css/game.css";

const params = new URLSearchParams(window.location.search);
const windowed = params.get("windowed") === "1";
const singleState = params.get("singleState") === "1";
const pregame = params.get("pregame") === "1";
const stateViewing = pregame ? -1 : 1;
const messageCount = Number(params.get("size") || 80);
document.documentElement.classList.add("dark-mode");
const theme = getSiteTheme(null, "dark");

// The censor helper expects the decoded list names. These checks catch a call
// site passing "swears"/"slurs", which silently returns the text unchanged.
const decodeRot13 = (value) =>
  value.replace(/[a-z]/g, (character) =>
    String.fromCharCode(((character.charCodeAt(0) - 97 + 13) % 26) + 97)
  );
const slurSample = decodeRot13(
  slurs.find((word) => word === "avttre") || slurs[0]
);
const swearSample = "shit";
window.__censorChecks = {
  swearMasked: filterProfanity(swearSample, {}, "*") !== swearSample,
  slurMasked:
    filterProfanity(slurSample, { disablePg13Censor: true }, "*") !==
    slurSample,
  allDisabledUnchanged:
    filterProfanity(
      swearSample,
      { disablePg13Censor: true, disableAllCensors: true },
      "*"
    ) === swearSample,
};

const user = {
  id: "u1",
  loggedIn: true,
  settings: {},
  autoContrastColor: (color) => color,
};

const players = {
  a: { id: "a", name: "Alice", userId: "ua" },
  b: { id: "b", name: "Bob", userId: "ub" },
  v: { id: "v", name: "Vinman", userId: "uv" },
};
const spectators = {
  s: { id: "s", name: "Watcher", userId: "us" },
};

const t0 = 1761500000000;
const messages = [];
const senders = ["a", "b", "v"];
for (let i = 0; i < messageCount; i++) {
  const senderId = senders[i % senders.length];
  messages.push({
    id: `${senderId}${i}`,
    senderId,
    meetingId: "village",
    content:
      senderId === "a" && i % 9 === 0
        ? `alice cop claim ${i}`
        : `${senderId} line ${i}`,
    time: t0 + i * 1000,
    quotable: true,
  });
}
messages.push({
  id: "s0",
  senderId: "s",
  meetingId: "village",
  content: "watching the cop claim",
  time: t0 + messageCount * 1000 + 1000,
  quotable: true,
});

const state = {
  name: pregame ? "Pregame" : "Day 1",
  meetings: {
    village: {
      id: "village",
      name: pregame ? "Pregame" : "Village",
      messages,
      speech: true,
      canTalk: true,
      amMember: true,
      members: Object.values(players).map((player) => ({ id: player.id })),
      votes: {},
    },
  },
  alerts: [
    {
      id: "server1",
      senderId: "server",
      meetingId: "village",
      content: "Alice has been lynched.",
      time: t0 + messageCount * 1000 + 2000,
    },
  ],
  obituaries: {},
  selTab: "village",
};

const game = {
  gameId: "speech-filter-fixture",
  active: params.get("active") !== "0",
  review: false,
  history: {
    currentState: stateViewing,
    states: { [stateViewing]: state },
  },
  stateViewing,
  updateHistory: () => {},
  updateStateViewing: () => {},
  isSpectator: false,
  options: {},
  players,
  self: "a",
  spectators,
  settings: {
    messageLayout: "default",
    virtualizeTranscript: windowed,
    timestamps: false,
    highlightMentions: true,
    roleMentions: false,
    votingLog: false,
  },
  socket: { on: () => {}, send: () => {} },
  isolatedPlayers: new Set(),
  isolationEnabled: false,
  setIsolationEnabled: () => {},
  togglePlayerIsolation: () => {},
  getSetupGameSetting: () => undefined,
  setup: { gameSettings: [] },
  onMessageQuote: () => {},
  onPinMessage: () => {},
  isMessagePinned: () => false,
};

function FixtureGame() {
  const [speechFilters, setSpeechFilters] = React.useState({
    from: "",
    contains: "",
  });
  const [speechFilterOpen, setSpeechFilterOpen] = React.useState(false);
  return (
    <GameContext.Provider
      value={{
        ...game,
        speechFilters,
        setSpeechFilters,
        speechFilterOpen,
        setSpeechFilterOpen,
      }}
    >
      <Box
        className="game"
        sx={{
          width: "100%",
          height: "100dvh",
          minHeight: 0,
          display: "flex",
          boxSizing: "border-box",
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <SpeechFilter />
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TextMeetingLayout seatActions={false} />
        </Box>
      </Box>
    </GameContext.Provider>
  );
}

document.documentElement.style.height = "100%";
document.body.style.cssText = "margin: 0; height: 100%; overflow: hidden";

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={{ showAlert: () => {} }}>
          <IsPhoneDeviceContext.Provider value={false}>
            <GameTypeContext.Provider value={{ singleState }}>
              <FixtureGame />
            </GameTypeContext.Provider>
          </IsPhoneDeviceContext.Provider>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  document.getElementById("root"),
  () => (window.__ready = true)
);

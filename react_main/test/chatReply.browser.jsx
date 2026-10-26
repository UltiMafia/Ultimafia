// Browser fixture for test/run-chat-reply.cjs: the real TextMeetingLayout chat
// with plain lines, a reply drawn as one row, a long multi-line reply, and a
// reply whose quote is not directly above it.
//
// Query: layout (messageLayout setting), st (state; -1 is pregame), anon=1
// (anonymous senders), noreply=1 (no reply handler, so rows are drawn exactly
// as without the reply feature).
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import { GameTypeContext, TextMeetingLayout } from "../src/pages/Game/Game";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import "../src/css/main.css";
import "../src/css/game.css";

const params = new URLSearchParams(window.location.search);
const layout = params.get("layout") || "default";
const anon = params.get("anon") === "1";
const st = Number(params.get("st") || -1);
const stName = st === -1 ? "Pregame" : "Day 1";
const theme = createTheme();
const user = {
  id: "u1",
  loggedIn: true,
  settings: {},
  autoContrastColor: (c) => c,
};
const S = (id) => (anon ? "anonymous" : id);
const t0 = 1761500000000;
const msgs = [
  {
    id: "m1aaaaaa",
    senderId: S("pA"),
    meetingId: "v1",
    content: "testing",
    time: t0,
    quotable: true,
  },
  {
    id: "m2aaaaaa",
    senderId: S("pB"),
    meetingId: "v1",
    content: "plain line from bob",
    time: t0 + 1000,
    quotable: true,
  },
  {
    id: "q1aaaaaa",
    isQuote: true,
    senderId: S("pC"),
    meetingId: "v1",
    messageId: "m1aaaaaa",
    fromMeetingId: "v1",
    fromState: st,
    time: t0 + 2000,
  },
  {
    id: "r1aaaaaa",
    senderId: S("pC"),
    meetingId: "v1",
    content: "yo im replying to this @Vinman",
    replyTo: "q1aaaaaa",
    time: t0 + 2001,
    quotable: true,
  },
  {
    id: "q2aaaaaa",
    isQuote: true,
    senderId: S("pB"),
    meetingId: "v1",
    messageId: "m1aaaaaa",
    fromMeetingId: "v1",
    fromState: st,
    time: t0 + 3000,
  },
  {
    id: "m3aaaaaa",
    senderId: S("pB"),
    meetingId: "v1",
    content: "a plain quote above (not a reply)",
    time: t0 + 4000,
    quotable: true,
  },
  {
    id: "q3aaaaaa",
    isQuote: true,
    senderId: S("pA"),
    meetingId: "v1",
    messageId: "m2aaaaaa",
    fromMeetingId: "v1",
    fromState: st,
    time: t0 + 5000,
  },
  {
    id: "m4aaaaaa",
    senderId: S("pB"),
    meetingId: "v1",
    content: "someone talks in between",
    time: t0 + 5001,
    quotable: true,
  },
  {
    id: "m5aaaaaa",
    senderId: S("pB"),
    meetingId: "v1",
    content:
      "a long line that wraps onto several lines so the row is taller than one line of text, which is where the reply button has room under the pin anyway and should sit at the bottom right corner",
    time: t0 + 4500,
    quotable: true,
  },
  {
    id: "q5aaaaaa",
    isQuote: true,
    senderId: S("pA"),
    meetingId: "v1",
    messageId: "m5aaaaaa",
    fromMeetingId: "v1",
    fromState: st,
    time: t0 + 4600,
  },
  {
    id: "r5aaaaaa",
    senderId: S("pA"),
    meetingId: "v1",
    content:
      "a multi-line reply: lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim",
    replyTo: "q5aaaaaa",
    time: t0 + 4601,
    quotable: true,
  },
  {
    id: "r3aaaaaa",
    senderId: S("pA"),
    meetingId: "v1",
    content: "reply whose quote is not directly above",
    replyTo: "q3aaaaaa",
    time: t0 + 5002,
    quotable: true,
  },
];
const meeting = {
  id: "v1",
  name: stName === "Pregame" ? "Pregame" : "Village",
  messages: msgs,
  speech: true,
  canTalk: true,
  amMember: true,
  members: [{ id: "pA" }, { id: "pB" }, { id: "pC" }],
  votes: {},
};
const players = {
  pA: { id: "pA", name: "AlageRheba10", userId: "uA" },
  pB: { id: "pB", name: "Bob", userId: "uB" },
  pC: { id: "pC", name: "Vinman", userId: "uC" },
};
const game = {
  gameId: "fixture",
  review: false,
  history: {
    currentState: st,
    states: {
      [st]: {
        name: stName,
        meetings: { v1: meeting },
        alerts: [],
        selTab: "v1",
      },
    },
  },
  stateViewing: st,
  updateHistory: () => {},
  isSpectator: false,
  options: {},
  players,
  self: "pC",
  spectators: {},
  settings: {
    messageLayout: layout,
    timestamps: true,
    highlightMentions: true,
    roleMentions: false,
  },
  filters: {},
  socket: { on: () => {}, send: () => {} },
  isolatedPlayers: new Set(),
  getSetupGameSetting: () => undefined,
  setup: { gameSettings: [] },
  onMessageQuote: () => {},
  onMessageReply: params.get("noreply") === "1" ? undefined : () => {},
  onPinMessage: () => {},
  isMessagePinned: () => false,
};
const root = document.createElement("div");
document.body.append(root);
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider value={{ showAlert: () => {} }}>
          <GameContext.Provider value={game}>
            <GameTypeContext.Provider value={{ singleState: false }}>
              <Box
                className="game"
                sx={{
                  width: 640,
                  height: 700,
                  backgroundColor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <TextMeetingLayout seatActions={false} />
              </Box>
            </GameTypeContext.Provider>
          </GameContext.Provider>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__ready = true),
);

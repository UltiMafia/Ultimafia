// Browser fixture for test/run-chat-reply.cjs: the real TextMeetingLayout chat
// with plain lines, a reply drawn as one row, a long multi-line reply, and a
// reply whose quote is not directly above it.
//
// Query: layout (messageLayout setting), st (state; -1 is pregame), anon=1
// (anonymous senders), noreply=1 (no reply handler, so rows are drawn exactly
// as without the reply feature), spec=1 (replies are spectator chat), dead=1
// (repliers are dead), ts=0 (timestamps off), styled=1 (AlageRheba10 and Bob
// have their own name colour, animated name, name font and text colour, so a
// reply's reference can be checked against the original line's row).
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Box, createTheme, ThemeProvider } from "@mui/material";
import { GameTypeContext, IsPhoneDeviceContext, TextMeetingLayout } from "../src/pages/Game/Game";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import { makeReplyTarget, redirectTypingToChat } from "../src/utils/messageReply";
import "../src/css/main.css";
import "../src/css/game.css";

const params = new URLSearchParams(window.location.search);
const layout = params.get("layout") || "default";
const anon = params.get("anon") === "1";
const st = Number(params.get("st") || -1);
const stName = st === -1 ? "Pregame" : "Day 1";
const themeMode = params.get("theme");
if (themeMode === "light" || themeMode === "dark") {
  document.documentElement.classList.add(`${themeMode}-mode`);
}
const theme = createTheme({ palette: {
  mode: themeMode === "dark" || (themeMode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
} });
const user = {
  id: "u1",
  loggedIn: true,
  settings: {},
  autoContrastColor: (c) => c,
};
const S = (id) => (anon ? "anonymous" : id);
const spec = params.get("spec") === "1";
const dead = params.get("dead") === "1";
// Extra flags for the reply lines (spectator chat, dead sender).
const R = { ...(spec ? { spectatorChat: true } : {}), ...(dead ? { alive: false } : {}) };
const t0 = 1761500000000;
const styled = params.get("styled") === "1";
// roles=1 turns role mentions on and gives the quoted line two of them, so a
// reply's reference can be checked for the space between a highlighted role
// and the words beside it.
const rolesOn = params.get("roles") === "1";
// sticker=1 puts a custom sticker in the quoted line. Replies collapse stickers
// to a "Click to see sticker" label, which is itself a flex box, so the reply
// text has to lay it out inline.
const stickerOn = params.get("sticker") === "1";
// decor=1 puts every inline decoration the quoted line can hold into one line:
// a role mention, a site emote and a collapsed sticker.
const decorOn = params.get("decor") === "1";
// emote=1 puts a custom emote between two words, so the space to its right can
// be measured on a normal message row.
const emoteOn = params.get("emote") === "1";
// A role mention is normally an icon plus coloured text, which hides a missing
// space behind the icon's own margin. The user's report is a highlighted chip
// that ends exactly at the word, so the fixture paints the mention the same way
// to make the gap measurable in a screenshot.
if (rolesOn) {
  const style = document.createElement("style");
  style.textContent = `
    .reply-reference-text span[style*="inline-flex"] {
      background: rgba(233, 30, 99, 0.85);
      color: #fff;
      border-radius: 2px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);
}
// Per-message colours, as the server stamps them on every line.
const COLORS = {
  pA: { nameColor: "#1f9d55", textColor: "#c2185b" },
  pB: { nameColor: "#1565c0", textColor: "#e65100" },
};
const msgs0 = [
  {
    id: "m1aaaaaa",
    senderId: S("pA"),
    meetingId: "v1",
    content: emoteOn
      ? "hello box world"
      : decorOn
        ? "Cop testing gun box"
      : rolesOn
        ? "Cop yeah no I'm Mafioso with an inno on Raya"
        : stickerOn
          ? "testing box"
          : "testing",
    ...(stickerOn || decorOn
      ? { customStickers: { box: { name: "box", path: "images/icon-192.png" } } }
      : {}),
    ...(emoteOn
      ? { customEmotes: { box: { name: "box", path: "images/icon-192.png" } } }
      : {}),
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
    ...R,
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
      "a multi-line reply @Vinman: lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim",
    replyTo: "q5aaaaaa",
    time: t0 + 4601,
    quotable: true,
    ...R,
  },
  {
    id: "r3aaaaaa",
    senderId: S("pA"),
    meetingId: "v1",
    content: "reply whose quote is not directly above",
    replyTo: "q3aaaaaa",
    time: t0 + 5002,
    quotable: true,
    ...R,
  },
  // Vinman talks, then replies within 30s: a follow-up from the same sender
  // (no header of its own).
  {
    id: "m6aaaaaa",
    senderId: S("pC"),
    meetingId: "v1",
    content: "first line from vinman",
    time: t0 + 6000,
    quotable: true,
  },
  {
    id: "q6aaaaaa",
    isQuote: true,
    senderId: S("pC"),
    meetingId: "v1",
    messageId: "m4aaaaaa",
    fromMeetingId: "v1",
    fromState: st,
    time: t0 + 6500,
  },
  {
    id: "r6aaaaaa",
    senderId: S("pC"),
    meetingId: "v1",
    content: "follow-up reply from vinman",
    replyTo: "q6aaaaaa",
    time: t0 + 6501,
    quotable: true,
    ...R,
  },
];
const msgs = msgs0.map((m) =>
  styled && !m.isQuote && COLORS[m.senderId]
    ? { ...m, ...COLORS[m.senderId] }
    : m
);
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
const STYLES = {
  pA: {
    nameFont: "georgia",
    animatedNameColor: "gradient",
    nameGradientColorA: "#ff0080",
    nameGradientColorB: "#00e5ff",
  },
  pB: { nameFont: "mono", animatedNameColor: "pulse" },
};
const players = {
  pA: { id: "pA", name: "AlageRheba10", userId: "uA", ...(styled ? STYLES.pA : {}) },
  pB: { id: "pB", name: "Bob", userId: "uB", ...(styled ? STYLES.pB : {}) },
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
    timestamps: params.get("ts") !== "0",
    highlightMentions: true,
    roleMentions: rolesOn || decorOn,
  },
  filters: {},
  socket: { on: () => {}, send: () => {} },
  isolatedPlayers: new Set(),
  getSetupGameSetting: () => undefined,
  setup: { gameSettings: [] },
  onMessageQuote: (m) => window.__quotes.push(m.id),
  onMessageReply:
    params.get("noreply") === "1"
      ? undefined
      : (m) => {
          window.__replies.push(m.id);
          window.__setReplyTarget(makeReplyTarget(m, st));
        },
  onPinMessage: (m) => window.__pins.push(m.id),
  isMessagePinned: () => false,
};
// Click to reply. Query: link=1 (a link in Bob's plain line), sys=1 (adds a
// server line). Replies, quotes and pins are recorded in window.__replies,
// __quotes and __pins; window.__unmount() removes the chat.
if (params.get("link") === "1") msgs[1].content += " https://example.com/x";
if (params.get("sys") === "1")
  msgs.push({
    id: "s1aaaaaa",
    senderId: "server",
    meetingId: "v1",
    content: "Bob has been lynched.",
    time: t0 + 7000,
  });
window.__replies = [];
window.__quotes = [];
window.__pins = [];
const root = document.getElementById("root") || document.createElement("div");
if (!root.isConnected) document.body.append(root);
window.__unmount = () => ReactDOM.unmountComponentAtNode(root);
// The game page's own "type to chat" keydown handler (Game.jsx).
window.addEventListener("keydown", (e) => redirectTypingToChat(e));
const mobile = params.get("mobile") === "1";
if (mobile) {
  document.documentElement.style.height = "100%";
  document.body.style.cssText = "margin: 0; height: 100%; overflow: hidden";
}
window.__sent = [];
// Stub transport only: the real SpeechInput builds and sends the reply payload.
game.socket.send = (type, payload) => window.__sent.push({ type, payload });
function FixtureGame({ children }) {
  const [replyTarget, setReplyTarget] = React.useState(null);
  window.__setReplyTarget = setReplyTarget;
  return (
    <IsPhoneDeviceContext.Provider value={mobile}>
      <GameContext.Provider value={{ ...game, replyTarget, setReplyTarget }}>
        {children}
      </GameContext.Provider>
    </IsPhoneDeviceContext.Provider>
  );
}
ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={user}>
        <SiteInfoContext.Provider
          value={{
            showAlert: () => {},
            roles: rolesOn || decorOn
              ? { Mafia: [{ name: "Cop" }, { name: "Mafioso" }, { name: "Doctor" }] }
              : undefined,
            rolesRaw: rolesOn || decorOn
              ? { Mafia: { Cop: {}, Mafioso: {}, Doctor: {} } }
              : undefined,
          }}
        >
          <FixtureGame>
            <GameTypeContext.Provider value={{ singleState: false }}>
              <Box
                className="game"
                sx={{
                  width: mobile ? "100%" : 640,
                  height: mobile ? "100dvh" : 700,
                  minHeight: 0,
                  boxSizing: "border-box",
                  backgroundColor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <TextMeetingLayout seatActions={false} />
              </Box>
            </GameTypeContext.Provider>
          </FixtureGame>
        </SiteInfoContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  root,
  () => (window.__ready = true),
);

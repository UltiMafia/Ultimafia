import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import {
  IsPhoneDeviceContext,
  TextMeetingLayout,
  useHistoryReducer,
  useSettingsReducer,
} from "../src/pages/Game/Game";
import { getSiteTheme } from "../src/constants/themes";
import { useIsPhoneDevice } from "../src/hooks/useIsPhoneDevice";
import "../src/css/main.css";
import "./chat.css";

const theme = getSiteTheme();
const noop = () => {};
const user = { settings: {}, autoContrastColor: (color) => color };
const siteInfo = { roles: {}, showAlert: noop };
const spectators = {};
const isolatedPlayers = new Set();
const options = {};
const players = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [
  `test-${i}`, { id: `test-${i}`, name: i === 0 ? "You" : `Player${i}`, alive: true },
]));
let nextId = 0;
const phrases = [
  "I think we should hear everyone's reasoning before voting.",
  "That matches what happened yesterday :)",
  "Can you explain why you changed your vote?",
  "> taking notes while the rest of the village argues",
  "I'm going back through the earlier messages. There are a few claims that don't quite match, especially the timing of the votes and who was present for each discussion.",
  "/me rereads the chat",
];

function makeMessage(content, senderId, time = Date.now()) {
  const id = nextId++;
  return {
    id: `perf-${id}`, senderId: senderId || `test-${Math.floor(id / 3) % 12}`,
    meetingId: "village", time, content: content || `${phrases[id % phrases.length]} (${id})`,
    alive: true, quotable: true,
  };
}

function makeState(count) {
  nextId = 0;
  const start = Date.now() - count * 1000;
  return {
    0: {
      name: "Day 1", selTab: "village", alerts: [], obituaries: {},
      meetings: {
        village: {
          id: "village", name: "Village", speech: true, amMember: true, canTalk: true,
          members: Object.keys(players), speechAbilities: [], voteRecord: [],
          messages: Array.from({ length: count }, (_, i) => makeMessage(null, null, start + i * 1000)),
        },
      },
    },
  };
}

function ChatPerformance() {
  const [history, updateHistory] = useHistoryReducer();
  const [settings, updateSettings] = useSettingsReducer();
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [streaming, setStreaming] = useState(false);
  const status = useRef();
  const isPhone = useIsPhoneDevice();

  useEffect(() => {
    updateHistory({ type: "set", history: makeState(100) });
  }, [updateHistory]);

  // This replaces only the transport. The real reducer, transcript, text input,
  // echo-to-clear behavior, formatting, and scroll handling run unchanged.
  const append = useCallback((message) => {
    const start = performance.now();
    updateHistory({ type: "addMessage", message });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (status.current) {
        status.current.textContent = `Append → next frame: ${Math.round(performance.now() - start)} ms`;
      }
    }));
  }, [updateHistory]);

  const socket = useMemo(() => ({
    send(event, data) {
      if (event === "speak") {
        // Deliver asynchronously like an echoed socket message, without network
        // delay or spam limits. Typing events intentionally have no recipient.
        setTimeout(() => append(makeMessage(data.content, "test-0")), 0);
      }
    },
  }), [append]);

  useEffect(() => {
    if (!streaming) return;
    const timer = setInterval(() => append(makeMessage()), 500);
    return () => clearInterval(timer);
  }, [streaming, append]);

  const isMessagePinned = useCallback((message) => Boolean(pinnedMessages[message.id]), [pinnedMessages]);
  const onPinMessage = useCallback((message) => {
    setPinnedMessages((previous) => {
      const next = { ...previous };
      if (next[message.id]) delete next[message.id];
      else next[message.id] = message;
      return next;
    });
  }, []);
  const onMessageQuote = useCallback((message) => {
    if (message.isQuote) return;
    append({ ...makeMessage("quote", "test-0"), isQuote: true,
      fromState: 0, fromMeetingId: "village", messageId: message.id });
  }, [append]);

  const state = history.states[0];
  const count = state?.meetings.village.messages.length || 0;
  const game = {
    history, updateHistory, players, spectators, settings, options,
    stateViewing: 0, self: "test-0", socket, review: false,
    isolationEnabled: false, isolatedPlayers, isSpectator: false,
    pinnedMessages, isMessagePinned, onPinMessage, onMessageQuote,
    getSetupGameSetting: noop, playAudio: noop, setup: { total: 12 },
  };

  function load(count) {
    setStreaming(false);
    setPinnedMessages({});
    updateHistory({ type: "set", history: makeState(count) });
    status.current.textContent = "Ready. Type a message below and press Return.";
  }

  return (
    <main className="chat-perf dark-mode">
      <div className="perf-controls">
        <strong>Chat test · {count.toLocaleString()} messages</strong>
        <div className="perf-buttons">
          {[0, 100, 1000, 5000, 10000].map((size) => (
            <button key={size} onClick={() => load(size)}>Load {size.toLocaleString()}</button>
          ))}
          <button onClick={() => append(makeMessage())}>Add one</button>
          <button onClick={() => setStreaming(!streaming)}>{streaming ? "Stop stream" : "Stream 2/sec"}</button>
        </div>
        <label>Layout: <select value={settings.messageLayout}
          onChange={(e) => updateSettings({ type: "setProp", propName: "messageLayout", propval: e.target.value })}>
          <option value="default">Default</option>
          <option value="defaultLarge">Large avatars</option>
          <option value="compactInline">Compact inline</option>
          <option value="compactAligned">Compact aligned</option>
        </select></label>
        <span> · {Object.keys(pinnedMessages).length} pinned</span>
        <output ref={status}>Ready. Type a message below and press Return.</output>
        <small>Local simulation. Frame timing includes rendering and frame waits, not server/network latency. Reload to reset.</small>
      </div>
      <GameContext.Provider value={game}>
        <IsPhoneDeviceContext.Provider value={isPhone}>
          <div className="game perf-game">
            {state && <TextMeetingLayout />}
          </div>
        </IsPhoneDeviceContext.Provider>
      </GameContext.Provider>
    </main>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SiteInfoContext.Provider value={siteInfo}>
        <UserContext.Provider value={user}>
          <ChatPerformance />
        </UserContext.Provider>
      </SiteInfoContext.Provider>
    </ThemeProvider>
  </BrowserRouter>,
  document.getElementById("root")
);

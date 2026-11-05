import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import {
  IsPhoneDeviceContext,
  TextMeetingLayout,
  ThreePanelLayout,
  SideMenu,
  SettingsMenu,
  useHistoryReducer,
  useSettingsReducer,
} from "../src/pages/Game/Game";
import { getSiteTheme } from "../src/constants/themes";
import { useIsPhoneDevice } from "../src/hooks/useIsPhoneDevice";
import "../src/css/main.css";
import "./chat.css";
import { NameWithAvatar } from "../src/pages/User/UserWidgets";

const params = new URLSearchParams(window.location.search);
const cosmetic = params.get("cosmetic") || "none";
const modes = ["rainbow", "pulse", "glow", "gradient", "patriotic", "tricolor"];
const initialCount = Number(params.get("count") || 100);
const nameplateTarget = params.has("nameplates")
  ? Math.max(1, Math.min(initialCount, Number(params.get("nameplates"))))
  : null;

const theme = getSiteTheme();
const noop = () => {};
const user = { settings: {}, autoContrastColor: (color) => color };
const siteInfo = { roles: {}, showAlert: noop };
const spectators = {};
const isolatedPlayers = new Set();
const options = {};
const players = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [
  `test-${i}`, { id: `test-${i}`, name: i === 0 ? "You" : `Player${i}`, alive: true,
    animatedNameColor: cosmetic === "mixed" ? modes[i % modes.length] : cosmetic },
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
    id: `perf-${id}`, senderId: senderId || `test-${(nameplateTarget === null ? Math.floor(id / 3)
      : id - Math.ceil(id * (initialCount - nameplateTarget) / initialCount)) % 12}`,
    meetingId: "village", time, content: content || `${phrases[id % phrases.length]} (${id})`,
    alive: true, quotable: true,
  };
}

function makeState(count) {
  nextId = 0;
  const start = Date.now() - count * 1000;
  const messages = Array.from({ length: count }, (_, i) => makeMessage(null, null, start + i * 1000));

  // Obituaries are tall special rows (a newspaper with deaths), not chat lines.
  // `?obits=1` puts three of them through the same renderer as the real game.
  const obituaries = {};
  if (params.get("obits") === "1") {
    const paper = (source, index, deaths) => ({
      id: `0:${source}`, source, time: start + index * 1000 + 500, dayCount: 2,
      obituaries: deaths.map((name, k) => ({
        id: `${source}-${k}`,
        playerInfo: { id: `${source}-${k}`, userId: `${source}-${k}`, name, avatar: false },
        snippets: {
          deathMessage: "was found dead in their home.",
          revealMessage: "They were the Doctor.",
          lastWill: "I was sure about the vote.",
        },
      })),
    });
    obituaries.Night = paper("Night", Math.floor(count * 0.25), ["Synthetic 1", "Synthetic 2"]);
    obituaries.Day = paper("Day", Math.floor(count * 0.5), ["Synthetic 3"]);
    obituaries.End = paper("Postgame", count - 1, ["Synthetic 4"]);
  }

  return {
    0: {
      name: "Day 1", selTab: "village", alerts: [], obituaries,
      dead: {}, exorcised: {},
      meetings: {
        village: {
          id: "village", name: "Village", speech: true, amMember: true, canTalk: true,
          members: Object.keys(players), speechAbilities: [], voteRecord: [],
          messages,
        },
      },
    },
  };
}

function ChatPerformance() {
  const [history, updateHistory] = useHistoryReducer();
  const [settings, updateSettings] = useSettingsReducer();
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [transcriptVersion, setTranscriptVersion] = useState("");
  const [streaming, setStreaming] = useState(false);
  const status = useRef();
  const isPhone = useIsPhoneDevice();

  useEffect(() => {
    updateHistory({ type: "set", history: makeState(initialCount) });
    if (params.has("settingsIntegration")) updateSettings({ type: "load" });
  }, [updateHistory, updateSettings]);

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

  // Read the renderer version from the DOM so the harness names the build it is
  // actually running, not a hard-coded label.
  useEffect(() => {
    if (params.get("virtual") !== "1") return undefined;
    const timer = setTimeout(() => setTranscriptVersion(
      document.querySelector("[data-transcript-window]")?.dataset.transcriptWindow || ""), 0);
    return () => clearTimeout(timer);
  }, [count]);
  const game = {
    ...(params.has("virtual") || !params.has("settingsIntegration")
      ? { transcriptWindowing: params.get("virtual") === "1" } : {}),
    history, updateHistory, players, spectators, settings: params.has("partialSettings")
      ? Object.fromEntries(Object.entries(settings).filter(([key]) => key !== "virtualizeTranscript"))
      : settings, updateSettings, options,
    stateViewing: 0, self: "test-0", socket, review: false,
    isolationEnabled: false, isolatedPlayers, isSpectator: false,
    pinnedMessages, isMessagePinned, onPinMessage, onMessageQuote,
    getSetupGameSetting: noop, playAudio: noop, setup: { total: 12 },
  };

  const load = useCallback((count) => {
    setStreaming(false);
    setPinnedMessages({});
    updateHistory({ type: "set", history: makeState(count) });
    status.current.textContent = "Ready. Type a message below and press Return.";
  }, [updateHistory]);

  useEffect(() => {
    window.chatPerf = { load, settings, updateSettings,
      append: (message) => append(message || makeMessage()), setStreaming,
      replyTo: (id) => {
        append({ ...makeMessage("quote", "test-0"), id: "perf-quote", isQuote: true,
          fromState: 0, fromMeetingId: "village", messageId: id });
        append({ ...makeMessage("a reply that jumps to old history", "test-0"), id: "perf-reply", replyTo: "perf-quote" });
      },
    };
    return () => { delete window.chatPerf; };
  }, [load, append, settings, updateSettings]);

  return (
    <main className={`chat-perf ${params.get("theme") === "light" ? "light-mode" : "dark-mode"} ${params.get("sweep") === "off" ? "perf-sweep-off" : ""}`}>
      <div className="perf-controls">
        <strong>Chat test · {count.toLocaleString()} messages{params.get("virtual") === "1" ? ` · ${transcriptVersion || "virtualized"}` : " · full DOM"}</strong>
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
        {params.has("settingsIntegration") && <div data-testid="settings-integration"
          style={{ position: "fixed", right: 0, top: 0, zIndex: 100, width: 340,
            maxHeight: "75vh", overflowY: "auto", background: theme.palette.background.paper }}>
          <SettingsMenu />
        </div>}
        <IsPhoneDeviceContext.Provider value={isPhone}>
          <div className="game perf-game">
            {state && (params.get("panels") === "flat" || isPhone ? <TextMeetingLayout /> :
              <ThreePanelLayout
                leftPanelContent={<SideMenu title="Players" scrollable content={
                  Object.values(players).map((p) => <NameWithAvatar key={p.id}
                    name={p.name} animatedNameColor={p.animatedNameColor} noLink />)
                } />}
                centerPanelContent={<TextMeetingLayout />}
                rightPanelContent={<SideMenu title="Actions" content={<div>No pending actions</div>} />}
              />)}
          </div>
        </IsPhoneDeviceContext.Provider>
      </GameContext.Provider>
    </main>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme} defaultMode={params.get("theme") || "dark"}>
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

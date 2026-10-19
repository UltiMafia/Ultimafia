// Replays recorded game socket frames into the real history reducer and chat
// panel, and measures chat render work per game action.
import React, { Profiler, useEffect, useReducer } from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { GameContext, SiteInfoContext, UserContext } from "../src/Contexts";
import {
  GameTypeContext,
  IsPhoneDeviceContext,
  TextMeetingLayout,
  useHistoryReducer,
  useSettingsReducer,
} from "../src/pages/Game/Game";
import { getSiteTheme } from "../src/constants/themes";

const noop = () => {};
const user = { settings: {}, autoContrastColor: (c) => c };
const siteInfo = { roles: {}, showAlert: noop };
const spectators = {};
const isolatedPlayers = new Set();
const options = {};
const socket = { send: noop };
const notPinned = () => false;
const typeContext = { singleState: true };

function toAction(eventName, data) {
  switch (eventName) {
    case "history": return { type: "set", history: data };
    case "state": return { type: "addState", state: data };
    case "meeting": return { type: "addMeeting", meeting: data };
    case "members": return { type: "meetingMembers", meetingId: data.meetingId, members: data.members };
    case "leftMeeting": return { type: "removeMeeting", meetingId: data };
    case "stateEvents": return { type: "stateEvents", stateEvents: data };
    case "message": return { type: "addMessage", message: data };
    default: return null;
  }
}

export function runBench(recording, container, hooks = {}) {
  const stats = { commits: 0, renderMs: 0 };
  let dispatch, viewSet, players = {}, self;
  for (const [e, d] of recording.frames) {
    if (e == "players") players = d;
    if (e == "self") self = d;
  }

  function Harness() {
    const [history, updateHistory] = useHistoryReducer();
    const [settings] = useSettingsReducer();
    const [view, setView] = useReducer((_, v) => v, null);
    dispatch = updateHistory;
    viewSet = setView;
    useEffect(() => {
      setView(history.currentState);
    }, [history.currentState]);
    if (!history || !history.states || view == null || !history.states[view]) return null;
    const game = {
      history, updateHistory, players, spectators, settings, options,
      stateViewing: view, self, socket, review: false,
      isolationEnabled: false, isolatedPlayers, isSpectator: false,
      isMessagePinned: notPinned, onPinMessage: noop, onMessageQuote: noop,
      getSetupGameSetting: noop, playAudio: noop, setup: { total: 7 },
    };
    return (
      <GameContext.Provider value={game}>
        <GameTypeContext.Provider value={typeContext}>
          <Profiler id="chat" onRender={(id, phase, actual) => { stats.commits += 1; stats.renderMs += actual; }}>
            <TextMeetingLayout />
          </Profiler>
        </GameTypeContext.Provider>
      </GameContext.Provider>
    );
  }

  act(() => {
    ReactDOM.render(
      <BrowserRouter>
        <ThemeProvider theme={getSiteTheme()}>
          <SiteInfoContext.Provider value={siteInfo}>
            <UserContext.Provider value={user}>
              <IsPhoneDeviceContext.Provider value={false}>
                <Harness />
              </IsPhoneDeviceContext.Provider>
            </UserContext.Provider>
          </SiteInfoContext.Provider>
        </ThemeProvider>
      </BrowserRouter>,
      container
    );
  });

  const feed = (from, to) => {
    for (let i = from; i < to; i++) {
      const action = toAction(...recording.frames[i]);
      if (action) act(() => dispatch(action));
    }
  };

  feed(0, recording.marker);
  if (hooks.beforeMeasure) hooks.beforeMeasure();
  const rows = () => container.querySelectorAll(".message").length;
  const results = [];
  for (const label of recording.labels) {
    const firstRow = container.querySelector(".message");
    let mutations = 0;
    const observer = new window.MutationObserver((list) => {
      for (const m of list) mutations += m.type == "childList" ? m.addedNodes.length + m.removedNodes.length : 1;
    });
    observer.observe(container, { subtree: true, childList: true, attributes: true, characterData: true });
    stats.commits = 0;
    stats.renderMs = 0;
    const t0 = performance.now();
    feed(label.from, label.to);
    const wallMs = performance.now() - t0;
    observer.takeRecords().forEach(() => {});
    observer.disconnect();
    results.push({
      label: label.label, commits: stats.commits, renderMs: stats.renderMs, wallMs, rows: rows(),
      firstRowKept: firstRow ? container.contains(firstRow) : null,
    });
  }
  if (hooks.afterMeasure) hooks.afterMeasure();
  return results;
}

// Rendered checks for the Liar's Dice board and the chat reducer, run under
// jsdom by react_main/perf/runChecks.js (no browser needed).
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { useHistoryReducer, getAllMessagesToDisplay } from "../src/pages/Game/Game";
import { RoundBetLog } from "../src/pages/Game/LiarsDiceGame";

function reducerHarness(container) {
  let state, dispatch;
  function H() {
    [state, dispatch] = useHistoryReducer();
    return null;
  }
  act(() => ReactDOM.render(<H />, container));
  return { get: () => state, send: (a) => act(() => dispatch(a)) };
}

function chatState(id, extraInfo, meetingId) {
  return { id, name: "Guess Dice", extraInfo, meetingId };
}

export function runChecks(container) {
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail });

  const r = reducerHarness(container);
  r.send({ type: "set", history: { "-1": { name: "Pregame", meetings: {}, alerts: [], roles: {}, dead: {}, exorcised: {} } } });
  r.send({ type: "addState", state: chatState(0, { bidInfo: { roundBids: [] } }) });
  r.send({ type: "addMeeting", meeting: { id: "casino-1", name: "Casino", speech: true, messages: [] } });
  r.send({ type: "selTab", state: 0, meetingId: "casino-1" });
  r.send({ type: "addMessage", message: { id: "m1", meetingId: "casino-1", content: "hi", time: 1 } });
  const before = r.get();
  r.send({ type: "addState", state: chatState(0, { bidInfo: { roundBids: [{ bidder: "A", amount: 2, face: 5 }] } }) });
  const after = r.get();
  check("re-sent state merges extraInfo", after.states[0].extraInfo.bidInfo.roundBids.length == 1);
  check("re-sent state keeps the chat", after.states[0].meetings === before.states[0].meetings && after.currentState == 0);

  const cachedFirst = getAllMessagesToDisplay(after);
  r.send({ type: "addState", state: chatState(1, { bidInfo: { roundBids: [] } }) });
  r.send({ type: "addMeeting", meeting: { id: "casino-2", name: "Casino", speech: true, messages: [] } });
  const next = r.get();
  check("new round carries the chat tab by name", next.states[1].selTab == "casino-2");
  check("new round's bet log starts empty", next.states[1].extraInfo.bidInfo.roundBids.length == 0);
  const all = getAllMessagesToDisplay(next);
  check("earlier messages stay the same objects", all[0] === cachedFirst[0] && all.length == cachedFirst.length);

  const host = document.createElement("div");
  container.appendChild(host);
  const history = {
    states: {
      0: { extraInfo: { bidInfo: { roundBids: [{ bidder: "Ann", amount: 2, face: 5 }, { bidder: "Bo", amount: 3, face: 5 }] } } },
      1: { extraInfo: { bidInfo: { roundBids: [] } } },
    },
  };
  act(() => ReactDOM.render(<RoundBetLog history={history} stateViewing={0} />, host));
  const rows = [...host.querySelectorAll(".ld-bet-log-row")].map((n) => n.textContent.replace(/\s+/g, " ").trim());
  check("bet log lists this round's bets in order", rows.length == 2 && rows[0].startsWith("Ann") && rows[1].startsWith("Bo") && rows[1].includes("3"), rows);
  act(() => ReactDOM.render(<RoundBetLog history={history} stateViewing={1} />, host));
  check("bet log is empty after a new roll", host.querySelectorAll(".ld-bet-log-row").length == 0 && /No bets yet/.test(host.textContent));
  act(() => ReactDOM.render(<RoundBetLog history={history} stateViewing={-1} />, host));
  check("bet log hidden in pregame", host.textContent == "");

  return results;
}

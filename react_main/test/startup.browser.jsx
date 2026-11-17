// Actual application bootstrap and Game; no live HTTP, WebSocket or audio.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import Main from "../src/Main";
import { parseMessage, stringifyMessage } from "../src/Socket";

const params = new URLSearchParams(location.search);
const optionalDelay = Number(params.get("optionalDelay") || 0);
const started = performance.now();
const records = [];
window.__startup = { records, started, sent: [] };
window.gtag = () => {};
localStorage.setItem("cacheVal", "startup-fixture");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const role = { name: "Villager", alignment: "Village", description: ["Find the Mafia."] };
const setup = { id: "startup", name: "Classic", gameType: "Mafia", total: 7, roles: [{ Villager: 7 }], closed: false, gameSettings: [], count: {} };
const optional = ["/api/achievements", "/api/roles/roletags", "/api/roles/descriptions", "/api/stocks/config"];
axios.defaults.adapter = async config => {
  const url = config.url;
  const record = { url, start: performance.now() - started };
  records.push(record);
  await delay(optional.includes(url) ? optionalDelay : 25);
  let data = {};
  if (url === "/api/user/info") data = { id: "startup-user", name: "NightOwl", csrf: "fixture", inGame: "startup", gamesPlayed: 50, settings: { disableSnowstorm: true, ignoreAllSounds: true }, perms: {}, groups: [], blockedUsers: [] };
  if (url === "/api/roles/all") data = { Mafia: [role] };
  if (url === "/api/roles/raw") data = { Mafia: { Villager: role } };
  if (["/api/roles/modifiers", "/api/roles/gamesettings", "/api/items"].includes(url)) data = { Mafia: [] };
  if (url === "/api/game/startup/info") data = { status: "In Progress", settings: {} };
  if (url.startsWith("/api/game/startup/connect")) data = { type: "Mafia", port: 3010, token: "fixture-only", hostId: "host" };
  record.end = performance.now() - started;
  return { data, status: 200, statusText: "OK", headers: {}, config };
};
class StartupSocket extends EventTarget {
  constructor(url) {
    super(); this.url = url; this.readyState = 0;
    queueMicrotask(() => { this.readyState = 1; this.dispatchEvent(new Event("open")); this.message("connected"); });
  }
  message(event, data) { this.dispatchEvent(new MessageEvent("message", { data: stringifyMessage(event, data) })); }
  send(raw) {
    const [event, data] = parseMessage(raw);
    window.__startup.sent.push([event, data]);
    queueMicrotask(() => {
      if (this.readyState !== 1) return;
      // The server answers heartbeats on an interval. An immediate echo creates
      // an unbounded microtask loop because the client immediately pings again.
      if (event === "p") setTimeout(() => { if (this.readyState === 1) this.message("p"); }, 10000);
      if (event === "auth") this.message("authSuccess");
      if (event === "join") {
        this.message("setup", setup);
        this.message("options", { spectating: true });
        this.message("players", { p1: { id: "p1", userId: "startup-user", name: "NightOwl", alive: true }, p2: { id: "p2", name: "Juniper", alive: true } });
        this.message("history", { 1: { name: "Day 1", roles: {}, dead: {}, exorcised: {}, alerts: [], stateEvents: [], obituaries: {}, selTab: "village", meetings: { village: { id: "village", name: "Village", speech: true, canTalk: true, amMember: true, members: [{ id: "p1" }, { id: "p2" }], messages: [], voteRecord: [], targets: [] } } } });
        this.message("self", "p1");
        this.message("isSpectator", false);
        this.message("loaded");
        window.__startup.loadedEventAt = performance.now() - started;
      }
    });
  }
  close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
}
window.WebSocket = StartupSocket;
window.Audio = class { addEventListener() {} removeEventListener() {} load() {} pause() {} play() { return Promise.resolve(); } };
const root = document.createElement("div"); document.body.append(root);
ReactDOM.render(<BrowserRouter><Main /></BrowserRouter>, root);

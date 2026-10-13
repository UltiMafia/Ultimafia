/*
 * Signs in a developer with Firebase email/password and checks the developer
 * API using only the resulting session cookie.
 *   LOGIN_FILE=... FIREBASE_API_KEY=... SETUP_ID=... BASE_URL=... node scripts/devapi-session-check.js
 */
const fs = require("fs");
const WebSocket = require("ws");
const { stringifyMessage, parseMessage } = require("../lib/sockets");

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const GAMES_HOST = process.env.GAMES_HOST || "localhost";
const { email, password } = JSON.parse(fs.readFileSync(process.env.LOGIN_FILE, "utf8"));
const start = Date.now();
const log = (...args) => console.log(`[${((Date.now() - start) / 1000).toFixed(1)}s]`, ...args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cookie = "";
let csrf = "";

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: { "content-type": "application/json", cookie, ...(csrf ? { "x-csrf": csrf } : {}) },
    body: body && JSON.stringify(body),
  });
  const setCookie = res.headers.getSetCookie();
  if (setCookie.length) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  if (!res.ok) throw new Error(`${method} ${path} ${res.status} ${text}`);
  return data;
}

function joinAsSelf(gameId, port, token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${GAMES_HOST}:${port}`);
    const timer = setTimeout(() => reject(new Error("join timed out")), 10000);
    ws.on("message", (raw) => {
      const [event] = parseMessage(String(raw));
      if (event == "connected") ws.send(stringifyMessage("auth", token));
      else if (event == "authSuccess") ws.send(stringifyMessage("join", { gameId }));
      else if (event == "loaded") {
        clearTimeout(timer);
        resolve(ws);
      }
    });
    ws.on("error", reject);
  });
}

(async () => {
  const signIn = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) }
  );
  const signInBody = await signIn.json();
  if (!signIn.ok) throw new Error(`firebase sign-in ${signIn.status} ${signInBody.error && signInBody.error.message}`);
  log("firebase signInWithPassword ok");

  await api("POST", "/auth", { idToken: signInBody.idToken });
  log("site /api/auth ok, session cookie set", Boolean(cookie));
  const info = await api("GET", "/user/info");
  csrf = info.csrf;
  log("signed in as", info.id, info.name);

  log("GET /dev/me", JSON.stringify(await api("GET", "/dev/me")));

  const gameId = await api("POST", "/game/host", {
    gameType: "Mafia",
    setup: process.env.SETUP_ID,
    lobby: "Testing",
    lobbyName: "devapi session check",
    private: true,
    spectating: true,
    stateLengths: { Day: 10, Night: 2 },
    extendLength: 1,
    pregameWaitLength: 1,
  });
  log("hosted Testing game", gameId);

  const open = await api("GET", "/game/list?list=open&lobby=Testing");
  log("in Testing lobby list", open.some((g) => g.id == gameId));

  const connect = await api("GET", `/game/${gameId}/connect`);
  const ws = await joinAsSelf(gameId, connect.port, connect.token);
  log("joined own game by id over the game socket");

  const spawned = await api("POST", "/dev/accounts", { gameId, count: 2 });
  log("spawned test accounts", spawned.map((a) => a.status));
  const control = (command, args) => api("POST", `/dev/games/${gameId}/control`, { command, args });
  log("timerScale", (await control("timerScale", { scale: 0.05 })).timerScale);
  await api("POST", "/dev/accounts", { gameId, count: 1 });

  let state;
  for (let i = 0; i < 40; i++) {
    state = await control("state");
    if (state.state != "Pregame") break;
    await sleep(250);
  }
  log("game started", state.state);
  log("pause", (await control("pause")).paused);
  log("step ->", (await control("step")).state);
  log("jumpTo Night 2 ->", (await control("jumpTo", { state: "Night 2" })).state);
  log("resume", (await control("resume")).paused);

  const mafia = (await control("state")).players.filter((p) => p.role == "Mafioso");
  for (const p of mafia) await control("kill", { player: p.id });
  await sleep(1500);
  log("after killing mafia", (await control("state")).state);

  ws.close();
  const fromPublicList = await api("GET", "/game/list?list=finished&lobby=All");
  log("hidden from All", !fromPublicList.some((g) => g.id == gameId));
  log("PASS");
  process.exit(0);
})().catch((e) => {
  log("FAIL", e.message);
  process.exit(1);
});

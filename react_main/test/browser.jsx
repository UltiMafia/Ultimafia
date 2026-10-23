import React, { useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, MemoryRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider, Dialog } from "@mui/material";
import axios from "axios";
import RetainedSiteRoutes from "../src/components/RetainedSiteRoutes";
import ViewOverlayBoundary from "../src/components/ViewOverlayBoundary";
import { SheetProvider, useSheet } from "../src/components/Sheet";
import { ProfileSheetProvider, useProfileSheet } from "../src/components/ProfileSheet";
import { UserContext, SiteInfoContext, UserProvider } from "../src/Contexts";
import { AppLocationContext, ViewActivityContext, ViewNavigate, useAppLocation, useViewActive, useViewNavigate } from "../src/hooks/useViewActivity";
import { useHostedGameSession } from "../src/hooks/useHostedGameSession";
import { useDismissOnBack } from "../src/hooks/useDismissOnBack";
import { useGameMembership } from "../src/hooks/useGameMembership";
import { useGameSessionIdentity } from "../src/hooks/useGameSessionIdentity";
import { useNewMessageCount } from "../src/hooks/useNewMessageCount";
import { ClientSocket, parseMessage, subscribeSocketListeners } from "../src/Socket";
import { useAppViewport } from "../src/hooks/useAppViewport";
import LobbyBrowser from "../src/pages/Play/LobbyBrowser/LobbyBrowser";
import { GameRow } from "../src/pages/Play/LobbyBrowser/GameRow";
import Game from "../src/pages/Game/Game";
import RoleMarkerToggle from "../src/pages/Game/components/RoleMarkerToggle";
import Chat from "../src/pages/Chat/Chat";
import { MediaEmbed } from "../src/pages/User/UserWidgets";
import { InGameContext } from "../src/Contexts";
import "../src/css/main.css";

const root = document.createElement("div");
document.body.append(root);
const results = document.createElement("pre");
document.body.append(results);
const failures = [];
const wait = (ms = 30) => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function until(predicate, message, ms = 5000) {
  const end = performance.now() + ms;
  while (!predicate()) {
    if (performance.now() > end) throw new Error(message);
    await wait();
  }
}
const theme = createTheme({ palette: { mode: "dark" }, breakpoints: { values: { xs: 0, sm: 600, md: 2000, lg: 2200, xl: 2400 } } });
let api;
let restoreGameHistory = null;
function mount(node) {
  api = null;
  ReactDOM.render(<ThemeProvider theme={theme}>{node}</ThemeProvider>, root);
}
async function cleanup() {
  deferChatConnect = false;
  ReactDOM.unmountComponentAtNode(root);
  if (restoreGameHistory) {
    window.history.replaceState(restoreGameHistory.state, "", restoreGameHistory.url);
    restoreGameHistory = null;
  }
  await wait(100);
}
async function run(name, fn) {
  try { await fn(); results.textContent += `PASS ${name}\n`; }
  catch (error) { failures.push({ name, message: error.message }); results.textContent += `FAIL ${name}: ${error.message}\n`; }
  finally { await cleanup(); }
}

class FakeSocket {
  static all = [];
  constructor() { this.readyState = 0; this.events = new Map(); this.sent = []; FakeSocket.all.push(this); }
  addEventListener(name, callback) { if (!this.events.has(name)) this.events.set(name, new Set()); this.events.get(name).add(callback); }
  removeEventListener(name, callback) { this.events.get(name)?.delete(callback); }
  emit(name, data) { for (const callback of [...(this.events.get(name) || [])]) callback(data); }
  open() { this.readyState = 1; this.emit("open"); }
  send(data) { this.sent.push(data); }
  message(data) { this.emit("message", {data}); }
  close() { this.readyState = 3; this.emit("close"); }
}
const originalWebSocket = window.WebSocket;
window.WebSocket = FakeSocket;

let viewActions;
function SiteView() {
  const [value, setValue] = useState(0);
  const [redirect,setRedirect] = useState(false);
  const guardedNavigate = useViewNavigate();
  useEffect(()=> { viewActions = {setRedirect,navigate:guardedNavigate}; });
  const active = useViewActive();
  const route = useLocation();
  const actual = useAppLocation();
  if (redirect) return <ViewNavigate to="/other" />;
  return <div data-testid="site"><button id="site-increment" onClick={() => setValue(v => v + 1)}>increment</button>
    <span id="site-value">{value}</span><span id="view-route">{route.pathname}</span>
    <span id="actual-route">{actual.pathname}</span><span id="site-active">{String(active)}</span>
    <span id="view-query">{route.search}{route.hash}</span>
    <div id="site-scroll" style={{height:60,overflowY:'auto'}}><div style={{height:600}}>scroll state</div></div>
    <Link id="enter-game" to="/game/one">game</Link></div>;
}
function SessionView({ id }) {
  const [messages, setMessages] = useState(0);
  useEffect(() => {
    const socket = new ClientSocket(`ws://fixture/${id}`);
    const unsubscribe = subscribeSocketListeners(socket, scoped => { scoped.on("message", () => setMessages(n => n + 1)); });
    socket.socket.open();
    return () => { unsubscribe(); socket.clear(); };
  }, [id]);
  return <span id="session-value">{messages}</span>;
}
function ProfileMediaView() {
  // A local silent WAV exercises native playback without external media requests.
  const bytes = new Uint8Array(8044);
  const wav = new DataView(bytes.buffer);
  const text = (offset, value) => [...value].forEach((c, i) => wav.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF"); wav.setUint32(4, 8036, true); text(8, "WAVEfmt ");
  wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true);
  wav.setUint32(24, 8000, true); wav.setUint32(28, 8000, true);
  wav.setUint16(32, 1, true); wav.setUint16(34, 8, true); text(36, "data");
  wav.setUint32(40, 8000, true); bytes.fill(128, 44);
  const mediaUrl = "data:audio/wav;base64," + btoa(String.fromCharCode(...bytes));
  return <div id="profile-media"><SiteView />
    <MediaEmbed mediaUrl={mediaUrl} mediaType="audio" loop collapsible />
    <MediaEmbed mediaUrl={mediaUrl} mediaType="video" loop />
    <MediaEmbed mediaUrl="https://www.youtube.com/watch?v=lifecycle01" />
    <MediaEmbed mediaUrl="https://soundcloud.com/lifecycle-fixture/track" />
    <MediaEmbed mediaUrl="https://open.spotify.com/track/lifecyclefixture" />
    <MediaEmbed mediaUrl="https://vimeo.com/123456789" />
    <MediaEmbed mediaUrl="https://yewtu.be/watch?v=lifecycle02" />
  </div>;
}
function SessionApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useHostedGameSession();
  useEffect(() => { api = { ...session, navigate }; });
  return <AppLocationContext.Provider value={location}>
    <RetainedSiteRoutes active={!session.inGame}><Route path="play" element={<SiteView key="play" />} /><Route path="other" element={<SiteView key="other" />} /><Route path="user/profile" element={<ProfileMediaView />} /></RetainedSiteRoutes>
    {session.hostedGameId && <ViewActivityContext.Provider value={session.inGame}><SessionView key={session.hostedGameId} id={session.hostedGameId} /></ViewActivityContext.Provider>}
  </AppLocationContext.Provider>;
}
function Driver() {
  const sheet = useSheet();
  const navigate = useNavigate();
  const profile = useProfileSheet();
  useEffect(() => { api = { ...sheet, ...profile, navigate }; });
  return <div className="mobile-nav">navigation</div>;
}
function StatefulSheetContent({ label }) {
  const [count,setCount] = useState(0);
  return <button id="sheet-counter" onClick={()=>setCount(n=>n+1)}>{label}:{count}</button>;
}
const user = { loggedIn: false, loaded: true, settings: {}, perms: {}, groups: [], blockedUsers: [] };
const siteInfo = { showAlert() {}, hideAllAlerts() {}, rolesRaw: {Mafia:{Villager:{name:'Villager',alignment:'Village',description:[]}}}, modifiers: {Mafia:[]}, cacheVal: 1 };
function Sheets({ profiles = false }) {
  return <MemoryRouter initialEntries={["/play"]}><UserContext.Provider value={user}><SiteInfoContext.Provider value={siteInfo}>
    <SheetProvider>{profiles ? <ProfileSheetProvider><Driver /></ProfileSheetProvider> : <Driver />}</SheetProvider>
  </SiteInfoContext.Provider></UserContext.Provider></MemoryRouter>;
}
function BoundaryFixture() {
  const [active, setActive] = useState(true);
  useEffect(() => { api = { setActive }; });
  return <ViewOverlayBoundary active={active}><Dialog open><span id="owned-dialog">owned dialog</span></Dialog></ViewOverlayBoundary>;
}
function MembershipDriver() {
  const member = useContext(UserContext);
  const [socket, setSocket] = useState({});
  useGameMembership(socket, "one");
  useEffect(() => {
    const next = new ClientSocket("ws://fixture/membership");
    next.socket.open(); setSocket(next);
    return () => next.clear();
  }, []);
  useEffect(() => { api = { member, socket }; });
  return <span id="membership">{member.inGame || "none"}</span>;
}
let identityChanges = 0;
function IdentityView() {
  const valid = useGameSessionIdentity(()=>identityChanges++);
  return <span id="identity-content">{valid?'original session':'hidden'}</span>;
}
function IdentityFixture() {
  const [id,setId] = useState('original');
  const [revision,setRevision] = useState(0);
  useEffect(()=> { api = {setId,setRevision}; });
  return <UserContext.Provider value={{...user,id,revision}}><IdentityView /></UserContext.Provider>;
}
function ChatFixture() {
  const [loggedIn,setLoggedIn] = useState(false);
  useEffect(()=> { api = {setLoggedIn}; });
  return <UserContext.Provider value={{...user,loggedIn,id:loggedIn?'member':null}}>
    <SiteInfoContext.Provider value={siteInfo}><Chat /></SiteInfoContext.Provider>
  </UserContext.Provider>;
}
const predictions = [];
function PredictionDriver() {
  const [playerId, setPlayerId] = useState('first');
  useEffect(() => { api = {setPlayerId}; });
  return <RoleMarkerToggle playerId={playerId} setup={{id:'fixture'}}
    toggleRolePrediction={(id,role)=>predictions.push({id,role})} />;
}
function Predictions() {
  return <MemoryRouter><UserContext.Provider value={user}><SiteInfoContext.Provider value={siteInfo}>
    <SheetProvider><PredictionDriver /></SheetProvider>
  </SiteInfoContext.Provider></UserContext.Provider></MemoryRouter>;
}
const ignore = () => {};
const publicGame = {
  id: "fixture-game", status: "Open", players: 9, spectating: true,
  lobby: "Main", lobbyName: "Main", type: "Mafia",
  setup: { id: "fixture", name: "Fixture", gameType: "Mafia", roles: "[{}]", total: 10, closed: false },
};
function GameSessionFixture({ delayed = false, loggedIn = true }) {
  const session = useHostedGameSession();
  const navigate = useNavigate();
  const [gameMounted, setGameMounted] = useState(!delayed);
  useEffect(() => { api = { ...session, navigate, setGameMounted }; });
  return <UserContext.Provider value={{ ...user, loggedIn, id: loggedIn ? "fixture-member" : null,
    refreshGameMembership: ignore, setInGame: ignore }}><SiteInfoContext.Provider value={siteInfo}>
    {!session.inGame && <GameRow small game={{ ...publicGame }} />}
    {session.hostedGameId && gameMounted && <ViewActivityContext.Provider value={session.inGame}>
      <Game key={session.hostedGameId} gameId={session.hostedGameId}
        joinSearch={session.hostedGameSearch} active={session.inGame} onLeave={session.leaveGameSession} />
    </ViewActivityContext.Provider>}
  </SiteInfoContext.Provider></UserContext.Provider>;
}
function mountGameSession(url, options = {}) {
  restoreGameHistory = { state: window.history.state, url: window.location.href };
  window.history.replaceState({ idx: 0, key: "game-fixture", usr: null }, "", url);
  FakeSocket.all = [];
  pending.length = 0;
  mount(<BrowserRouter><GameSessionFixture {...options} /></BrowserRouter>);
}
async function nextGameRequest(spectating) {
  await until(() => pending.some(p => !p.handled), "game connection request");
  let request = pending.find(p => !p.handled);
  request.handled = true;
  if (!spectating) {
    assert(request.url === "/api/game/fixture-game/info", "unexpected game info URL: " + request.url);
    request.resolve({ status: "Open", settings: {} });
    await until(() => pending.some(p => !p.handled), "game connect after info");
    request = pending.find(p => !p.handled);
    request.handled = true;
  }
  assert(request.url === "/api/game/fixture-game/connect" + (spectating ? "?spectate=true" : ""),
    "connection changed join intent: " + request.url);
  return request;
}
async function authenticateGame(request, token = "fixture-token", beforeAuth = ignore) {
  const previousCount = FakeSocket.all.length;
  request.resolve({ type: "Fixture", port: 3010, token, hostId: "host" });
  await until(() => FakeSocket.all.length > previousCount, "game socket");
  const native = FakeSocket.all[FakeSocket.all.length - 1];
  native.open(); native.message("connected");
  if (token) {
    await until(() => native.sent.some(s => parseMessage(s)?.[0] === "auth"), "game auth");
    await beforeAuth();
    native.message("authSuccess");
  }
  await until(() => native.sent.some(s => parseMessage(s)?.[0] === "join"), "game join");
  return { native, join: native.sent.map(parseMessage).find(([event]) => event === "join")[1] };
}
function MembershipFixture() {
  return <SiteInfoContext.Provider value={siteInfo}>
    <UserProvider setUserLoading={ignore} setSiteTheme={ignore}><MembershipDriver /></UserProvider>
  </SiteInfoContext.Provider>;
}
function LobbyFixture() {
  const [active, setActive] = useState(true);
  useEffect(() => { api = { setActive }; });
  return <MemoryRouter initialEntries={["/play?lobby=Main"]}>
    <UserContext.Provider value={user}><SiteInfoContext.Provider value={siteInfo}>
      <ViewActivityContext.Provider value={active}><InGameContext.Provider value={!active}>
        <LobbyBrowser />
      </InGameContext.Provider></ViewActivityContext.Provider>
    </SiteInfoContext.Provider></UserContext.Provider>
  </MemoryRouter>;
}
function BackFixture() {
  const [first, setFirst] = useState(false);
  const [second, setSecond] = useState(false);
  useDismissOnBack(first, () => setFirst(false));
  useDismissOnBack(second, () => setSecond(false));
  useEffect(() => { api = { setFirst, setSecond, first, second }; });
  return <span>{String(first)}:{String(second)}</span>;
}

const pending = [];
let deferChatConnect = false;
const originalAdapter = axios.defaults.adapter;
axios.defaults.adapter = config => new Promise((resolve, reject) => {
  if (config.url === "/api/user/online") return resolve({data: {}, status: 200, headers: {}, config});
  if (config.url === '/api/chat/connect' && deferChatConnect) {
    pending.push({url:config.url,config,resolve:data=>resolve({data,status:200,headers:{},config})});
    return;
  }
  if (/^\/api\/game\/fixture-game\/(info|connect)(\?|$)/.test(config.url)) {
    pending.push({ url: config.url, config, resolve: data => resolve({ data, status: 200, headers: {}, config }), reject });
    return;
  }
  if (config.url !== '/api/setup/fixture' && config.url !== '/api/user/info' && !config.url.startsWith('/api/user/') &&
      !config.url.startsWith('/api/game/list?')) {
    const data = config.url.startsWith('/api/game/openCounts') ? {counts:{},hasOpen:false}
      : config.url.startsWith('/api/setup/featuredSetup') ? null
      : config.url.startsWith('/api/chat/connect') ? '' : [];
    return resolve({data, status:200, headers:{}, config});
  }
  pending.push({url: config.url, config, resolve: data => resolve({data, status: 200, headers: {}, config}), reject});
});
const fakeProfile = id => ({id, name: id, stats: {}, settings: {}, groups: [], achievements: [], gamesPlayed: 0});

function NewMessageFixture() {
  const [view, setView] = useState({
    messageCount: 10, transcriptKey: "day-1:public", enabled: true, autoScroll: false,
  });
  const count = useNewMessageCount(view);
  useEffect(() => { api = { update: patch => setView(current => ({ ...current, ...patch })) }; });
  return <span id="new-message-count">{count}</span>;
}

async function updateMessageView(patch, expected) {
  api.update(patch);
  await wait();
  assert(document.querySelector("#new-message-count").textContent === String(expected),
    `expected ${expected} new messages after ${JSON.stringify(patch)}`);
}

async function tests() {
  await run("game entry query survives browsing before the lazy game mounts", async () => {
    mountGameSession("/game/fixture-game?spectate=true", { delayed: true });
    await until(() => api?.hostedGameId, "hosted game entry");
    api.navigate("/play"); await until(() => !api.inGame, "browse before game mount");
    api.setGameMounted(true);
    const request = await nextGameRequest(true);
    const { join } = await authenticateGame(request);
    assert(join.spectate === true, "lazy mount lost spectator intent");
  });

  await run("authenticated spectator joins and reconnects keep their intent while browsing", async () => {
    mountGameSession("/game/fixture-game?spectate=true");
    const request = await nextGameRequest(true);
    api.navigate("/play"); await until(() => !api.inGame, "browse during connect");
    const { native, join } = await authenticateGame(request);
    assert(join.spectate === true, "auth join took a player seat");
    api.navigate("/game/fixture-game"); await until(() => api.inGame, "return without a spectator query");
    assert(FakeSocket.all.length === 1 && api.hostedGameSearch === "?spectate=true",
      "ordinary return replaced the socket or changed join intent");
    api.navigate("/play?bot"); await until(() => !api.inGame, "browse again before reconnect");
    native.close();
    const reconnect = await nextGameRequest(true);
    const returned = await authenticateGame(reconnect, "reconnect-token");
    assert(returned.join.spectate === true, "reconnect lost spectator intent");
  });

  await run("navigation between socket authentication and join cannot change spectate intent", async () => {
    mountGameSession("/game/fixture-game?spectate=true");
    const request = await nextGameRequest(true);
    const { join } = await authenticateGame(request, "fixture-token", async () => {
      api.navigate("/play"); await until(() => !api.inGame, "browse while authentication is pending");
    });
    assert(join.spectate === true, "auth response used the new page's query");
  });

  await run("only a server-confirmed seat change replaces spectator reconnect intent", async () => {
    mountGameSession("/game/fixture-game?spectate=true");
    const first = await authenticateGame(await nextGameRequest(true));
    first.native.message("isSpectator:boolean:true");
    first.native.message("takeSeatFailed:string:No open seats.");
    first.native.close();
    const retry = await authenticateGame(await nextGameRequest(true), "retry-token");
    assert(retry.join.spectate === true, "failed seat request stopped spectating");
    // takeSeat sends this only after successfully creating the player.
    retry.native.message("isSpectator:boolean:false");
    api.navigate("/play"); await until(() => !api.inGame, "browse after taking a seat");
    retry.native.close();
    const seated = await authenticateGame(await nextGameRequest(false), "seated-token");
    assert(seated.join.spectate === false, "reconnect gave up the confirmed player seat");
  });

  await run("guest spectators keep their intent when the page changes before joining", async () => {
    mountGameSession("/game/fixture-game?spectate=true", { loggedIn: false });
    const request = await nextGameRequest(true);
    api.navigate("/play"); await until(() => !api.inGame, "guest browses during connect");
    const { join } = await authenticateGame(request, false);
    assert(join.spectate === true, "guest join took a player seat");
  });

  await run("unrelated site queries cannot change a player or bot join", async () => {
    mountGameSession("/game/fixture-game?bot");
    const request = await nextGameRequest(false);
    api.navigate("/play?spectate=true"); await until(() => !api.inGame, "browse during player connect");
    const { join } = await authenticateGame(request);
    assert(join.spectate === false && join.isBot === true, "site query changed the session's join flags");
  });

  await run("explicit Spectate re-enters the server even for an already retained game", async () => {
    mountGameSession("/game/fixture-game");
    await authenticateGame(await nextGameRequest(false));
    api.navigate("/play"); await until(() => !api.inGame, "browse from seated game");
    const link = [...root.querySelectorAll("a")].find(el => el.textContent === "Spectate");
    assert(link, "lobby spectator link missing");
    let documentNavigation;
    const intercept = event => {
      if (!link.contains(event.target)) return;
      // Observe React Router's handling at document bubble, then prevent the
      // actual reload so this fixture can finish. Production must NOT turn the
      // membership-changing click into a same-session client-side route change.
      documentNavigation = { preventedByRouter: event.defaultPrevented, href: link.getAttribute("href") };
      event.preventDefault();
    };
    document.addEventListener("click", intercept);
    try { link.click(); } finally { document.removeEventListener("click", intercept); }
    assert(documentNavigation && !documentNavigation.preventedByRouter,
      "Spectate reused the seated session without asking the server");
    assert(documentNavigation.href === "/game/fixture-game?spectate=true", "wrong spectator destination");
  });

  await run("full public lobbies retain Spectate without exposing restricted games", async () => {
    const cases = [
      [{ players: 9 }, true, ["Join", "Spectate"]],
      [{ players: 10 }, true, ["Spectate"]],
      [{ status: "In Progress", players: 10 }, true, ["Spectate"]],
      [{ players: 10, spectating: false }, true, []],
      [{ players: 10, private: true }, true, []],
      [{ players: 10, broken: true }, true, []],
      [{ players: 10 }, false, []],
      [{ status: "Finished", players: 10 }, false, ["Review"]],
    ];
    for (const [patch, loggedIn, expected] of cases) {
      mount(<MemoryRouter><UserContext.Provider value={{ ...user, loggedIn }}><SiteInfoContext.Provider value={siteInfo}>
        <GameRow small game={{ ...publicGame, ...patch }} />
      </SiteInfoContext.Provider></UserContext.Provider></MemoryRouter>);
      await wait();
      const buttons = [...root.querySelectorAll("a")].filter(el => el.getAttribute("href")?.startsWith("/game/"));
      assert(JSON.stringify(buttons.map(el => el.textContent)) === JSON.stringify(expected),
        "wrong lobby controls: " + JSON.stringify({ patch, loggedIn, actual: buttons.map(el => el.textContent) }));
    }
  });

  await run("unread messages exclude initial history, accumulate live arrivals and clear at bottom", async () => {
    mount(<NewMessageFixture />);
    await until(() => api, "message fixture mount");
    assert(document.querySelector("#new-message-count").textContent === "0", "initial history counted");
    await updateMessageView({ messageCount: 12 }, 2);
    await updateMessageView({ messageCount: 15 }, 5);
    await updateMessageView({ autoScroll: true }, 0);
    await updateMessageView({ messageCount: 17 }, 0);
    await updateMessageView({ autoScroll: false }, 0);
    await updateMessageView({ messageCount: 18 }, 1);
  });

  await run("review and historical transcripts never accumulate unread messages", async () => {
    mount(<NewMessageFixture />);
    await until(() => api, "message fixture mount");
    await updateMessageView({ messageCount: 11 }, 1);
    await updateMessageView({ enabled: false, messageCount: 40 }, 0);
    await updateMessageView({ transcriptKey: "day-2:public", messageCount: 100 }, 0);
    await updateMessageView({ transcriptKey: "day-3:public", messageCount: 200 }, 0);
    await updateMessageView({ messageCount: 250 }, 0);
    await updateMessageView({ enabled: true, messageCount: 300 }, 0);
    await updateMessageView({ messageCount: 301 }, 1);
  });

  await run("day, meeting, filter and voting-log changes reset the unread baseline", async () => {
    mount(<NewMessageFixture />);
    await until(() => api, "message fixture mount");
    let messageCount = 10;
    for (const transcriptKey of ["day-2:public", "day-2:mafia", "filter-cleared", "voting-log-on", "other-game"]) {
      await updateMessageView({ messageCount: ++messageCount }, 1);
      messageCount += 50;
      await updateMessageView({ transcriptKey, messageCount }, 0);
    }
    await updateMessageView({ messageCount: ++messageCount }, 1);
  });

  await run("retained routes see their view URL; lifecycle sees actual navigation", async () => {
    FakeSocket.all = [];
    mount(<MemoryRouter initialEntries={["/play?lobby=Main#list"]}><Routes><Route path="/*" element={<SessionApp />} /></Routes></MemoryRouter>);
    await until(() => api, "session fixture mount");
    document.querySelector('#site-increment').click();
    document.querySelector('#enter-game').click();
    await until(() => api.inGame && document.querySelector('#session-value'), "game mount");
    assert(document.querySelector('#site-value').textContent === '1', 'site state remounted');
    assert(document.querySelector('#view-route').textContent === '/play', 'saved matching changed');
    assert(document.querySelector('#actual-route').textContent === '/game/one', 'real navigation was hidden');
    assert(document.querySelector('#site-active').textContent === 'false', 'hidden view remains active');
    FakeSocket.all[0].message('message:string:one'); await wait();
    api.navigate('/other'); await wait();
    FakeSocket.all[0].message('message:string:two'); await wait();
    api.navigate('/game/one'); await wait();
    assert(FakeSocket.all.length === 1, 'navigation replaced the socket');
    assert(document.querySelector('#session-value').textContent === '2', 'hidden session lost updates');
    api.leaveGameSession(); await wait();
    assert(!document.querySelector('#session-value'), 'leave retained the session');
    assert(FakeSocket.all[0].readyState === 3, 'leave did not dispose socket');
    assert(document.querySelector('#view-route').textContent === '/other', 'leave lost previous page');
  });

  await run("returning from a profile to a retained game stops native media and removes provider players", async () => {
    const savedOptions = localStorage.getItem("mediaOptions");
    localStorage.setItem("mediaOptions", JSON.stringify({volume:0.25,muted:true}));
    try {
      mount(<MemoryRouter initialEntries={["/game/one"]}><SessionApp /></MemoryRouter>);
      await until(() => api?.hostedGameId === "one", "initial game");
      const socket = FakeSocket.all[FakeSocket.all.length - 1];
      api.navigate("/user/profile");
      await until(() => root.querySelectorAll("#profile-media iframe").length === 5, "profile players");
      document.getElementById("site-increment").click();
      document.querySelector('[aria-label="Collapse media player"]').click();
      const players = [...root.querySelectorAll("audio, video")];
      assert(players.length === 2, "native audio and video rendered");
      for (const player of players) {
        assert(player.volume === 0.25 && player.muted, "saved media options applied");
        await player.play();
        assert(!player.paused, "native media playing before navigation");
      }
      document.getElementById("enter-game").click();
      await until(() => api.inGame, "return to game");
      assert(!root.querySelector("#profile-media audio, #profile-media video, #profile-media iframe"), "inactive profile must not retain media players");
      await until(() => players.every(player => player.paused), "detached native media stopped");
      assert(socket.readyState === 1, "return preserves game socket");
      assert(document.getElementById("site-value").textContent === "1", "profile state retained");
      api.navigate("/user/profile");
      await until(() => root.querySelectorAll("#profile-media iframe").length === 5, "players recreated on profile return");
      assert(root.querySelector("audio") !== players[0], "return creates a fresh player");
      await until(() => root.querySelector("audio").volume === 0.25 && root.querySelector("audio").muted, "recreated player restores saved media options");
      assert(document.querySelector('[aria-label="Expand media player"]'), "collapsed preference retained");
    } finally {
      if (savedOptions === null) localStorage.removeItem("mediaOptions");
      else localStorage.setItem("mediaOptions", savedOptions);
    }
  });

  await run("inactive view redirects and old imperative callbacks cannot redirect a game", async () => {
    mount(<MemoryRouter initialEntries={["/play"]}><SessionApp /></MemoryRouter>);
    await until(()=>api && viewActions,'navigation guard fixture');
    const oldNavigate = viewActions.navigate;
    api.navigate('/game/one'); await until(()=>api.inGame && api.hostedGameId,'enter game');
    oldNavigate('/other'); await wait();
    assert(api.inGame,'inactive imperative callback redirected game');
    viewActions.setRedirect(true); await wait();
    assert(api.inGame,'inactive declarative redirect redirected game');
    api.navigate('/play'); await until(()=>!api.inGame && document.querySelector('#view-route')?.textContent==='/other','deferred redirect did not apply on return');
  });

  await run("explicit leave preserves the previous query/hash and the same scroll element", async () => {
    mount(<MemoryRouter initialEntries={["/play?lobby=Sandbox#list"]}><SessionApp /></MemoryRouter>);
    await until(() => api, 'return fixture');
    const scroller = document.querySelector('#site-scroll'); scroller.scrollTop = 42;
    document.querySelector('#enter-game').click();
    await until(() => api.inGame && api.hostedGameId, 'enter game');
    api.leaveGameSession(); await until(() => !api.inGame, 'leave game');
    assert(document.querySelector('#view-query').textContent === '?lobby=Sandbox#list','previous URL lost');
    assert(document.querySelector('#site-scroll') === scroller && scroller.scrollTop === 42,'scroll container remounted');
  });

  await run("Back to a game restores that entry's leave destination", async () => {
    mount(<MemoryRouter initialEntries={["/play?lobby=Main#list"]}><SessionApp /></MemoryRouter>);
    await until(() => api, 'history return fixture');
    api.navigate('/game/one'); await until(() => api.inGame && api.hostedGameId, 'enter game');
    api.navigate('/other'); await until(() => !api.inGame, 'browse profile');
    api.navigate(-1); await until(() => api.inGame, 'back to game');
    api.navigate(1); await until(() => !api.inGame, 'forward to profile');
    api.navigate(-1); await until(() => api.inGame, 'back to game again');
    api.leaveGameSession(); await until(() => !api.inGame, 'leave game');
    assert(document.querySelector('#view-route').textContent === '/play', 'leave returned to profile instead of original page');
    assert(document.querySelector('#view-query').textContent === '?lobby=Main#list', 'original query/hash lost');
    assert(!document.querySelector('#session-value'), 'leave retained session');
  });

  await run("server leave while browsing closes the session without redirecting", async () => {
    mount(<MemoryRouter initialEntries={["/play"]}><SessionApp /></MemoryRouter>);
    await until(() => api, 'background leave fixture');
    api.navigate('/game/one'); await until(() => api.hostedGameId, 'session');
    api.navigate('/other'); await until(() => !api.inGame,'browse away');
    api.leaveGameSession(); await wait();
    assert(document.querySelector('#view-route').textContent === '/other','background leave redirected');
    assert(!document.querySelector('#session-value'),'background leave kept session');
  });

  await run("direct game links leave to Play, with no unrelated browser Back", async () => {
    mount(<MemoryRouter initialEntries={["/game/direct"]}><SessionApp /></MemoryRouter>);
    await until(() => api?.hostedGameId, 'direct session mount');
    api.leaveGameSession(); await wait();
    assert(document.querySelector('#view-route').textContent === '/play', 'direct fallback');
  });

  await run("retained-view dialogs portal into their owner and hide with it", async () => {
    mount(<BoundaryFixture />); await until(() => api && document.querySelector('#owned-dialog'), 'dialog mount');
    const owner = root.querySelector('div');
    assert(owner.contains(document.querySelector('#owned-dialog')), 'dialog escaped owner boundary');
    api.setActive(false); await wait();
    assert(document.querySelector('#owned-dialog').getClientRects().length === 0, 'hidden view dialog is visible');
    api.setActive(true); await wait();
    assert(document.querySelector('#owned-dialog').getClientRects().length > 0, 'dialog lost state on return');
  });

  await run("sheet ownership, content updates and navigation cancellation", async () => {
    mount(<Sheets />); await until(() => api, 'sheet driver');
    const first = api.reserveSheet(); first.show(() => <span id="old-sheet">old</span>); await wait();
    const second = api.reserveSheet(); second.show(() => <span id="current-sheet">current</span>); await wait();
    first.close(); await wait();
    assert(!!document.querySelector('#current-sheet'), 'stale owner closed newer sheet');
    second.update(() => <span id="current-sheet">updated props</span>); await wait();
    assert(document.querySelector('#current-sheet').textContent === 'updated props', 'sheet snapshot stayed stale');
    const pendingRequest = api.reserveSheet(); api.navigate('/other'); await wait();
    assert(!pendingRequest.show(() => <span>late</span>), 'navigation resurrected a pending sheet');
    await wait(350);
    assert(!document.documentElement.hasAttribute('data-sheet'), 'nav flag stuck');
  });

  await run("sheet updates preserve own UI state, but replacement owners reset it", async () => {
    mount(<Sheets />); await until(()=>api,'sheet state fixture');
    const first = api.reserveSheet(); first.show(()=> <StatefulSheetContent label="first" />); await wait();
    document.querySelector('#sheet-counter').click(); await wait();
    first.update(()=> <StatefulSheetContent label="updated" />); await wait();
    assert(document.querySelector('#sheet-counter').textContent === 'updated:1','owner update remounted content');
    const second = api.reserveSheet(); second.show(()=> <StatefulSheetContent label="second" />); await wait();
    assert(document.querySelector('#sheet-counter').textContent === 'second:0','replacement inherited previous owner state');
  });

  await run("drag follows directly, retains release offset, and reveals navbar before exit", async () => {
    mount(<Sheets />); await until(() => api, 'sheet driver');
    let renders = 0;
    const sheetRequest = api.reserveSheet(); sheetRequest.show(() => { renders++; return <div>drag fixture</div>; });
    await wait(350);
    const handle = document.querySelector('button[aria-label="Close sheet"]');
    const paper = document.querySelector('.MuiDrawer-paper');
    // Synthetic pointers cannot acquire native capture; stub capture only. All
    // React handlers, Paper motion, CSS and MUI exit lifecycle are real.
    handle.setPointerCapture = () => {};
    const pointer = (type, y) => handle.dispatchEvent(new PointerEvent(type, {bubbles:true, pointerId:1, isPrimary:true, button:0, clientY:y}));
    const before = renders;
    pointer('pointerdown', 100);
    for (let y = 101; y <= 155; y++) pointer('pointermove', y);
    // Browsers normalize zero to either "0" or "0px" in CSS serialization.
    await until(() => Number.parseFloat(paper.style.translate.split(' ')[1]) === 55, 'drag offset');
    assert(renders === before, 'pointer motion rerendered sheet content');
    const releaseOffset = paper.style.translate;
    pointer('pointerup', 155);
    assert(paper.style.translate === releaseOffset, 'release jumped upward');
    assert(!document.documentElement.hasAttribute('data-sheet'), 'navbar waits for exit');
    await wait(400);
    assert(!document.querySelector('.MuiDrawer-paper'), 'sheet did not dismiss');
  });

  await run("profile response cannot replace a newer sheet or reopen after navigation", async () => {
    pending.length = 0; mount(<Sheets profiles />); await until(() => api, 'profile driver');
    const first = api.openProfile('old-profile', {});
    await until(() => pending.length === 1, 'profile fetch');
    const replacement = api.reserveSheet(); replacement.show(() => <span id="replacement">role chooser</span>);
    pending[0].resolve(fakeProfile('old-profile')); await first; await wait();
    assert(!!document.querySelector('#replacement'), 'old profile stole sheet');
    api.closeProfile(); await wait();
    assert(!!document.querySelector('#replacement'), 'old profile close stole sheet');
    const next = api.openProfile('next-profile', {});
    await until(() => pending.length === 2, 'second profile fetch');
    api.navigate('/other'); await wait(); pending[1].resolve(fakeProfile('next-profile')); await next;
    assert(!document.documentElement.hasAttribute('data-sheet'), 'late profile opened after navigation');
  });

  await run("role-marking sheet uses current callbacks and never opens a nested hover card", async () => {
    predictions.length = 0; pending.length = 0; mount(<Predictions />);
    await until(() => api, 'prediction driver');
    root.querySelector('.role-marker').click();
    await until(() => pending.length === 1, 'prediction fetch');
    pending[0].resolve({roles:'[{"Villager:":1}]',gameType:'Mafia'});
    await until(() => document.querySelector('.MuiDrawer-paper [aria-label="Mark role as Villager"]'), 'prediction content');
    api.setPlayerId('second'); await wait(100);
    const icon = document.querySelector('.MuiDrawer-paper [aria-label="Mark role as Villager"] .role');
    icon.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));
    assert(!document.querySelector('.MuiPopover-paper'),'prediction hover opened a card');
    icon.click(); await wait();
    assert(predictions.length === 1 && predictions[0].id === 'second' && predictions[0].role === 'Villager:', 'selection used stale callback: '+JSON.stringify(predictions));
    assert(!document.documentElement.hasAttribute('data-sheet'),'selection failed to dismiss sheet');
  });

  await run("actual user provider + socket membership lifecycle rejects late join results", async () => {
    pending.length = 0; mount(<MembershipFixture />);
    await until(() => api?.socket?.socket && pending.length === 1, 'membership fixture');
    const session = {id:'member',name:'Member',settings:{},perms:{},rank:0,csrf:'fixture'};
    pending[0].resolve(session); await until(() => api.member.loaded, 'bootstrap');
    api.socket.socket.message('loaded'); await until(() => pending.length === 2, 'join refresh');
    pending[1].resolve({...session,inGame:'one'});
    await until(() => api.member.inGame === 'one', 'join membership not updated');
    api.socket.socket.message('loaded'); await until(() => pending.length === 3, 'reconnect refresh');
    api.socket.socket.message('finished'); await until(() => api.member.inGame === null, 'finish not cleared');
    pending[2].resolve({...session,inGame:'one'}); await wait();
    assert(api.member.inGame === null,'late response resurrected warning');
    api.member.setInGame('other'); await wait(); api.socket.socket.message('left'); await wait();
    assert(api.member.inGame === 'other','old session cleared another game');
    api.member.refreshUser(); await until(() => pending.length === 4,'full refresh');
    pending[3].resolve(session); await until(() => api.member.inGame === null,'absent membership not cleared');
    api.member.setInGame('one'); await wait(); api.member.clear(); await wait();
    assert(api.member.inGame === null,'logout warning remains');
  });

  await run("retained game identity survives refresh but not an account switch", async () => {
    identityChanges=0; mount(<IdentityFixture />); await until(()=>api,'identity fixture');
    api.setRevision(1); await wait();
    assert(document.querySelector('#identity-content').textContent==='original session' && identityChanges===0,'same account refresh discarded game');
    api.setId('another-account'); await wait();
    assert(document.querySelector('#identity-content').textContent==='hidden' && identityChanges===1,'account switch retained old private session');
  });

  await run("real chat cancels logout races and cleans replaced subscriptions", async () => {
    pending.length=0; FakeSocket.all=[]; deferChatConnect=true;
    mount(<MemoryRouter><ChatFixture /></MemoryRouter>); await until(()=>api,'chat fixture');
    api.setLoggedIn(true); await until(()=>pending.length===1,'login token');
    api.setLoggedIn(false); await wait(); pending[0].resolve('stale-token'); await wait();
    assert(FakeSocket.all.length===0,'late token opened a socket after logout');
    api.setLoggedIn(true); await until(()=>pending.length===2,'second login token');
    pending[1].resolve('current-token'); await until(()=>FakeSocket.all.length===1,'chat socket');
    const native=FakeSocket.all[0]; native.open(); native.message('connected'); await wait();
    native.message('connected'); await wait();
    native.message('openDM:string:dm'); await wait();
    assert(native.sent.filter(s=>s==='getChannel:string:dm').length===1,'repeated registration retained old handlers');
    api.setLoggedIn(false); await until(()=>native.readyState===3,'logout did not dispose socket');
    const sent=native.sent.length; native.message('openDM:string:late'); await wait();
    assert(native.sent.length===sent,'disposed chat still handled events');
  });

  await run("real lobby rejects reversed responses and invalidates requests while inactive", async () => {
    window.gtag = () => {}; pending.length = 0; mount(<LobbyFixture />);
    await until(() => pending.some(p=>p.url.includes('lobby=Main')), 'initial lobby request');
    const main = pending.find(p=>p.url.includes('lobby=Main'));
    const sandbox = [...document.querySelectorAll('[role=tab]')].find(el => el.textContent.includes('Sandbox'));
    sandbox.click();
    await until(() => pending.some(p=>p.url.includes('lobby=Sandbox')), 'new lobby request');
    const next = pending.find(p=>p.url.includes('lobby=Sandbox'));
    const game = (id, lobby) => ({id,status:'Finished',lobby,lobbyName:id,endTime:Date.now(),type:'Mafia',broken:true,setup:{id:'fixture',name:id,gameType:'Mafia',roles:'[{}]',total:1,closed:false}});
    next.resolve([game('accepted-new-lobby','Sandbox')]); await wait(100);
    main.resolve([game('obsolete-old-lobby','Main')]); await wait(100);
    assert(root.textContent.includes('accepted-new-lobby'),'new lobby missing');
    assert(!root.textContent.includes('obsolete-old-lobby'),'old lobby overwrote new');
    const button = root.querySelector('.fa-sync-alt'); button.parentElement.click();
    await until(() => pending.length === 3,'manual refresh');
    assert(pending[2].url.includes('last=Infinity&page=1'),'reload lost accepted cursor');
    api.setActive(false); await wait(); pending[2].resolve([game('late-inactive','Sandbox')]); await wait(100);
    assert(!root.textContent.includes('late-inactive'),'inactive response accepted');
    api.setActive(true); await until(() => pending.length === 4,'return failed to refresh');
    pending[3].resolve([game('returned-current','Sandbox')]); await wait(100);
    assert(root.textContent.includes('returned-current'),'return stuck loading');
  });

  await run("only accepted page/lobby cursors are used by refresh", async () => {
    window.gtag = () => {}; pending.length = 0; mount(<LobbyFixture />);
    const game = (id,endTime) => ({id,status:'Finished',lobby:'Main',lobbyName:id,endTime,type:'Mafia',broken:true,setup:{id:'fixture',name:id,gameType:'Mafia',roles:'[{}]',total:1,closed:false}});
    await until(() => pending.length === 1,'initial page');
    pending[0].resolve([game('page-one',102)]); await wait(80);
    root.querySelector('.page-nav .fa-angle-right').parentElement.click();
    await until(() => pending.length === 2,'page two');
    assert(pending[1].url.includes('last=102&page=2'),'page two cursor');
    pending[1].resolve([game('page-two',51)]); await wait(80);
    root.querySelector('.page-nav .fa-angle-right').parentElement.click();
    await until(() => pending.length === 3,'page three');
    pending[2].resolve([]); await wait(80);
    root.querySelector('.fa-sync-alt').parentElement.click();
    await until(() => pending.length === 4,'refresh accepted page');
    assert(pending[3].url === pending[1].url,'empty page advanced the reload cursor');
    pending[3].resolve([game('page-two',51)]); await wait(80);
    [...root.querySelectorAll('[role=tab]')].find(el=>el.textContent.includes('Sandbox')).click();
    await until(() => pending.length === 5,'lobby switch');
    pending[4].reject(new Error('simulated failed lobby fetch')); await wait(80);
    root.querySelector('.fa-sync-alt').parentElement.click();
    await until(() => pending.length === 6,'retry new lobby');
    assert(pending[5].url.includes('lobby=Sandbox&last=Infinity&page=1'),'new lobby inherited old cursor after failure');
    pending[5].resolve([]); await wait(80);
  });

  await run("Back markers preserve router state and dismiss only the top overlay", async () => {
    const original = {state:window.history.state, url:window.location.href};
    window.history.replaceState({idx:0,key:'before',usr:{value:7}}, '', '/test-before');
    window.history.pushState({idx:1,key:'route',usr:{value:9}}, '', '/test-page');
    mount(<BrowserRouter><BackFixture /></BrowserRouter>); await until(() => api, 'Back fixture');
    api.setFirst(true); await wait();
    assert(window.history.state.key === 'route' && window.history.state.usr.value === 9, 'router state destroyed');
    api.setSecond(true); await wait(); window.history.back();
    await until(() => !api.second, 'top overlay Back');
    assert(api.first, 'Back closed both overlays');
    api.setFirst(false); await wait(120); window.history.back();
    await until(() => window.location.pathname === '/test-before', 'dead marker requires extra Back');
    window.history.replaceState(original.state, '', original.url);
  });

  await run("keyboard flag recovers without blur in both resize modes", async () => {
    function ViewportFixture() { useAppViewport(); return <input id="focused-field" />; }
    const descriptors = {};
    const replace = (object, key, value) => {
      descriptors[key] = {object, descriptor:Object.getOwnPropertyDescriptor(object,key)};
      Object.defineProperty(object,key,{configurable:true,value,writable:true});
    };
    const viewport = new EventTarget(); viewport.height = 600; viewport.offsetTop = 0;
    replace(window,'innerHeight',600); replace(window,'visualViewport',viewport);
    replace(document.documentElement,'clientHeight',600);
    try {
      mount(<ViewportFixture />); await wait(); document.querySelector('#focused-field').focus();
      viewport.height = 300; viewport.dispatchEvent(new Event('resize'));
      assert(document.documentElement.dataset.keyboard === 'open','visual-only keyboard');
      viewport.height = 600; viewport.dispatchEvent(new Event('resize'));
      assert(!document.documentElement.dataset.keyboard,'keyboard closed but focus retained');
      window.innerHeight = 300; document.documentElement.clientHeight = 300; viewport.height = 300;
      window.dispatchEvent(new Event('resize'));
      assert(document.documentElement.dataset.keyboard === 'open','layout-resizing keyboard');
      assert(document.documentElement.style.getPropertyValue('--app-bottom') === '0px','double keyboard inset');
      window.innerHeight = 600; document.documentElement.clientHeight = 600; viewport.height = 600;
      window.dispatchEvent(new Event('resize'));
      assert(!document.documentElement.dataset.keyboard,'layout keyboard recovery');
      await cleanup();
    } finally {
      for (const [key,{object,descriptor}] of Object.entries(descriptors)) {
        if (descriptor) Object.defineProperty(object,key,descriptor); else delete object[key];
      }
    }
  });
}

tests().catch(error => { failures.push({name:'runner',message:error.message}); }).finally(() => {
  window.WebSocket = originalWebSocket;
  axios.defaults.adapter = originalAdapter;
  window.__lifecycleResults = { failures, passed: results.textContent.split('\n').filter(s => s.startsWith('PASS')).length };
  results.textContent += failures.length ? '\nFAILED\n' : '\nALL PASS\n';
});

// Production views; controlled transport only. Never connects to a real game.
import React, { useState, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { CssBaseline, Stack, ThemeProvider } from "@mui/material";
import { Header, Footer } from "../src/Main";
import SiteLayout from "../src/components/SiteLayout";
import { Announcement } from "../src/components/alerts/Announcement";
import LeaveGameDialog from "../src/components/LeaveGameDialog";
import MafiaGame from "../src/pages/Game/MafiaGame";
import { makeReplyTarget } from "../src/utils/messageReply";
import { useAppViewport } from "../src/hooks/useAppViewport";
import { ViewActivityContext } from "../src/hooks/useViewActivity";
import { SheetProvider } from "../src/components/Sheet";
import { ProfileSheetProvider } from "../src/components/ProfileSheet";
import { GameContext, UserContext, SiteInfoContext } from "../src/Contexts";
import { getSiteTheme } from "../src/constants/themes";
import LobbyBrowser from "../src/pages/Play/LobbyBrowser/LobbyBrowser";
import Learn from "../src/pages/Learn/Learn";
import Community from "../src/pages/Community/Community";
import FloatingDmWindow from "../src/components/dms/FloatingDmWindow";
import { DmWindowContext } from "../src/components/dms/DmWindowContext";
import UiIcon from "../src/components/ui/UiIcon";
import { UiIconFamilyContext } from "../src/components/ui/UiIcon";
import { uiIconSets } from "../src/components/ui/iconSets";
import SiteNavigation from "../src/components/SiteNavigation";
import { iconChoices } from "./icon-choices/families";
import UiAction from "../src/components/ui/UiAction";
import UiPending from "../src/components/ui/UiPending";
import { pixelIconPaths } from "../src/components/ui/pixelIcons";
import { LiarsDiceRulesModal } from "../src/pages/Game/LiarsDiceGame";
import { RatscrewRulesModal } from "../src/pages/Game/RatscrewGame";
import { PolicyPeekModal, LoyaltyRevealModal } from "../src/pages/Game/SecretDictatorGame";
import { VetoAssentModal } from "../src/pages/Game/SDPolicyAction";
import { PokerRaisePopover } from "../src/pages/Game/PokerActions";
import DrawTools from "../src/pages/Game/components/DrawTools";
import { ActionList, GameTypeContext, MobileLayout, PlayerList, TextMeetingLayout, ThreePanelLayout, TopBar } from "../src/pages/Game/Game";
import "../src/css/main.css";
import "../src/css/accessibility.css";
import { parseMessage, stringifyMessage } from "../src/Socket";

const params = new URLSearchParams(location.search);
const light = params.get("theme") === "light";
document.documentElement.classList.add(light ? "light-mode" : "dark-mode");
const theme = getSiteTheme(undefined, light ? "light" : "dark");
window.gtag = () => {};
window.__sent = [];
const ignore = () => {};
const user = {
  id: "u1", name: "NightOwl", loggedIn: params.get("guest") !== "1", loaded: true,
  settings: { disableSnowstorm: true }, perms: { postReply: true }, groups: [], blockedUsers: [],
  redHearts: 12, goldHearts: 0, inGame: null, autoContrastColor: c => c,
  clear: ignore, setInGame: ignore,
  dailyChallenges: params.has("homefeatures") ? ["Basic1:0:Mafia", "Advanced2:0:Cop"] : [],
};
const roleNames = ["Villager", "Cop", "Doctor", "Mafioso", "Hooker",
  ...(params.has("long") ? ["Gunsmith", "Blacksmith", "Sheriff", "Ninja", "Paralyzer", "Astrologer", "Warlock", "Werewolf", "Janitor", "Godfather"] : []),
];
const rolesRaw = { Mafia: Object.fromEntries(roleNames.map(name => [name, {
  name, alignment: ["Mafioso", "Hooker"].includes(name) ? "Mafia" : "Village",
  description: [`${name} role description.`],
}])) };
const siteInfo = {
  cacheVal: 1, showAlert: ignore, hideAllAlerts: ignore, rolesRaw,
  roles: { Mafia: Object.values(rolesRaw.Mafia) }, modifiers: { Mafia: [] }, items: { Mafia: [] },
   gameSettings: { Mafia: {} }, gamesettings: { Mafia: [{ name: "Whispers" }] }, achievements: {},
};
const setup = {
  id: "fixture", name: params.has("long") ? "A setup with a long name and fifteen different roles" : params.has("pregame") ? "GNH" : "Classic", gameType: "Mafia", total: roleNames.length + 2,
  roles: [Object.fromEntries(roleNames.map((name, index) => [name, index === 0 ? 3 : 1]))],
  count: {}, gameSettings: {}, closed: false, creator: { id: "u1", name: "NightOwl", avatar: false },
  ...(params.has("pregame") ? { ranked: true, competitive: true, numMissions: 5, firstTeamSize: 2, lastTeamSize: 4, teamFailLimit: 5 } : {}),
};
const games = [
  { id: "open", status: "Open", players: 4, lobbyName: "NightOwl's lobby", spectating: true },
  { id: "full", status: "Open", players: 7, lobbyName: "Juniper's lobby", spectating: true, ranked: true },
  { id: "live", status: "In Progress", players: 7, lobbyName: "Moth's lobby", spectating: true, gameState: "Day 2", ...(params.has("homefeatures") ? { competitive: true } : {}) },
  { id: "finished", status: "Finished", players: 7, lobbyName: "Rook's lobby", endTime: Date.now() - 900000 },
].map(g => ({ lobby: "Main", setup: { ...setup }, spectatorCount: 2, ...g,
  ...(params.has("long") ? { lobbyName: "A lobby name long enough to wrap onto another line on a phone" } : {}),
}));
const people = params.has("longnames") ? ["MeyeroffHudgens33", "IlsaLindgren57", "JaritaHayott99", "DyanneWales35", "DavyPeltier69", "LongPlayerName22", "AnotherPlayer44"] : ["NightOwl", "Juniper", "Moth", "Detective", "Velvet", "Rook", "Sol"];
const chatMembers = people.slice(0, 3).map((name, index) => ({ id: `u${index + 1}`, name, settings: {}, groups: [], status: "online" }));
const chatRoom = { id: "lobby", name: "Lobby", public: true, members: chatMembers };
const directRoom = { id: "fixture-direct", public: false, members: chatMembers.slice(0, 2), lastMessageDate: Date.now() - 60000, lastMessage: { content: "Will you be around later?", senderId: "u2", date: Date.now() - 60000 } };
const chatMessages = ["Anyone joining the next game?", "Yes, I'll host Classic.", "Thanks. I'll join when it's up."].map((content, index) => ({ id: `chat-${index}`, content, sender: chatMembers[index], date: Date.now() - (3 - index) * 60000, channel: "lobby" }));
window.__chatSent = [];
class FixtureChatSocket extends EventTarget {
  constructor() {
    super();
    this.readyState = 0;
    queueMicrotask(() => {
      if (this.readyState !== 0) return;
      this.readyState = 1;
      this.dispatchEvent(new Event("open"));
      this.message("connected");
    });
  }
  message(event, data) { this.dispatchEvent(new MessageEvent("message", { data: stringifyMessage(event, data) })); }
  send(raw) {
    const [event, data] = parseMessage(raw);
    window.__chatSent.push([event, data]);
    queueMicrotask(() => {
      if (this.readyState !== 1) return;
      if (event === "auth") this.message("chatInfo", { rooms: [chatRoom], directs: params.has("dm") ? [directRoom] : [], users: chatMembers, notifs: [] });
      if (event === "getChannel") {
        this.channelId = data;
        this.message("channel", { ...(data === directRoom.id ? directRoom : chatRoom), messages: chatMessages.map(message => ({ ...message, channel: data })) });
      }
      if (event === "sendMessage") this.message("message", { id: `sent-${Date.now()}`, content: data, sender: chatMembers[0], date: Date.now(), channel: this.channelId || "lobby" });
    });
  }
  close() { this.readyState = 3; this.dispatchEvent(new Event("close")); }
}
window.WebSocket = FixtureChatSocket;
const wallComments = [
  { id: "wall-1", location: "lobby", content: "Anyone up for Classic this evening?", author: { id: "u2", name: "Juniper", avatar: false, groups: [] }, date: Date.now() - 900000, vote: 0, voteCount: 3 },
  { id: "wall-2", location: "lobby", content: "I'll be around after the current game.", author: { id: "u3", name: "Moth", avatar: false, groups: [] }, date: Date.now() - 600000, vote: 0, voteCount: 1 },
];
axios.defaults.adapter = async config => {
  let data = [];
  if (config.url.startsWith("/api/comment?")) data = { comments: wallComments.map(comment => ({ ...comment })), maxPage: 1 };
  else
  if (config.url.startsWith("/api/game/list?")) data = params.get("empty") ? [] : games;
  else if (config.url.startsWith("/api/game/openCounts")) data = { counts: { All: 2, Main: 2 }, hasOpen: true };
  else if (config.url.startsWith("/api/setup/featuredSetup")) data = { ...setup };
  else if (config.url === "/api/setup/fixture") data = { ...setup, roles: JSON.stringify(setup.roles), creator: { id: "u1", name: "NightOwl" } };
  else if (config.url.startsWith("/api/competitive/roundInfo")) data = {};
  else if (config.url.startsWith("/api/competitive/seasons")) data = params.has("homefeatures") ? [{ number: 1, rounds: [{ number: 1, startDate: "2026-01-01", remainingOpenDays: 3, remainingReviewDays: 2, completed: false }] }] : [];
  else if (config.url.startsWith("/api/chat/connect")) data = params.has("chat") || params.has("dm") ? "fixture-only" : "";
  else if (config.url.startsWith("/api/poll/")) data = { polls: [], activePolls: [], currentPoll: null };
  else if (config.url.startsWith("/api/mod/announcements")) {
    const notices = [
      { id: "latest", date: 1794000000000, content: "Maintenance notice (test data): Servers restart at 02:00 UTC. Games may be unavailable for 15 minutes. This text checks wrapping and announcement navigation." },
      { id: "older", date: 1793900000000, content: "Previous announcement (test data)." },
      ...(params.has("noticepages") ? Array.from({ length: 5 }, (_, index) => ({ id: `old-${index + 2}`, date: 1793900000000 - (index + 2) * 100000, content: `Earlier announcement ${index + 2} (test data).` })) : []),
    ];
    const query = new URL(config.url, location.origin).searchParams;
    data = params.has("notice") ? notices.filter(item => (!query.has("last") || item.date < Number(query.get("last"))) && (!query.has("first") || item.date > Number(query.get("first")))).slice(0, 5) : [];
    if (params.has("noticepages") && window.__deferAnnouncementResponse && query.has("last")) {
      return new Promise(resolve => { window.__releaseAnnouncementResponse = () => resolve({ data, status: 200, headers: {}, config }); });
    }
  }
  else if (config.url.startsWith("/api/user/online") || config.url.startsWith("/api/user/searchName"))
    data = people.map((name, i) => ({ id: `u${i + 1}`, name, status: "Online" }));
  else if (config.url === "/api/stampTrades/open") data = params.has("trades") ? [{ id: "offer-1", initiator: { id: "u2", name: "Juniper", avatar: false }, initiatorRole: "Cop", initiatorGameType: "Mafia" }] : [];
  else if (config.url === "/api/stampTrades/recent") data = params.has("trades") ? [{ id: "recent-1", initiator: { id: "u2", name: "Juniper" }, recipient: { id: "u3", name: "Moth" }, initiatorRole: "Cop", initiatorGameType: "Mafia", recipientRole: "Doctor", recipientGameType: "Mafia" }] : [];
  else if (config.url === "/api/user/u1/profile") data = { stamps: [{ role: "Villager", gameType: "Mafia", count: 3 }, { role: "Doctor", gameType: "Mafia", count: 2 }] };
  return { data, status: 200, headers: {}, config };
};

function GameFixture() {
  const [selectedPanel, setSelectedPanel] = useState("chat");
  const [stateViewing, setStateViewing] = useState(params.has("pregame") ? -1 : 1);
  const [selectedMeetings, setSelectedMeetings] = useState({ 0: "village", 1: "village" });
  const [rolePredictions, setRolePredictions] = useState(params.has("roles") ? { p4: "Doctor" } : {});
  const [votes, setVotes] = useState({ p1: ["p4"], p3: ["p4"] });
  const [sentMessages, setSentMessages] = useState([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [meetingOverrides, setMeetingOverrides] = useState({});
  const [settings, setSettings] = useState({ timestamps: true, messageLayout: "default", highlightMentions: true, votingLog: true, terminologyEmoticons: true, roleMentions: true, sfxVolume: 0.7, deathSoundVolume: 0.7, musicVolume: 0.5, pregameMusicVolume: 0.5, importantVolume: 0.8 });
  window.__setGameMeeting = setMeetingOverrides;
  window.__setFixtureStateViewing = setStateViewing;
  const [replyTarget, setReplyTarget] = useState(params.has("reply") ? makeReplyTarget({ id: "message0", senderId: "p1", meetingId: "village", content: "Morning. Did anyone learn anything last night?", time: 1794000000000 }, 1) : null);
  const handlers = useRef(new Map());
  const socket = useMemo(() => ({
    readyState: params.has("offline") ? 3 : 1,
    on(event, handler) {
      if (!handlers.current.has(event)) handlers.current.set(event, new Set());
      handlers.current.get(event).add(handler);
      if (event === "timerInfo" || event === "time") queueMicrotask(() => {
        if (!handlers.current.get(event)?.has(handler)) return;
        handler(event === "timerInfo" ? { name: "main", delay: 240000 } : { name: "main", time: 30000 });
      });
      return handler;
    },
    off(event, handler) { handlers.current.get(event)?.delete(handler); },
    send(event, data) {
      window.__sent.push([event, data]);
      const echo = () => setSentMessages(previous => previous.concat({ id: `sent-${previous.length}`, senderId: "p0", ...data, time: 1794000600000 + previous.length * 1000, quotable: true }));
      if (event === "speak") {
        if (params.has("delayecho")) window.__ackGameSpeak = echo;
        else queueMicrotask(echo);
      }
      if (event === "vote") queueMicrotask(() => setVotes(previous => ({ ...previous, p0: [data.selection] })));
      if (event === "unvote") queueMicrotask(() => setVotes(previous => { const next = { ...previous }; delete next.p0; return next; }));
    },
  }), []);
  window.__emitGameEvent = (event, data) => handlers.current.get(event)?.forEach(handler => handler(data));
  const players = Object.fromEntries(people.map((name, i) => [`p${i}`, {
    id: `p${i}`, userId: `u${i + 1}`, name, index: i, role: i === 0 ? "Cop" : undefined,
  }]));
  const members = Object.keys(players).map(id => ({ id, canVote: true }));
  const meeting = {
    id: "village", name: "Village", actionName: "Vote", speech: true, canTalk: true,
    amMember: true, voting: true, canVote: true, inputType: "player", actionType: "select",
    targets: [...Object.keys(players), "*"], members, votes, voteRecord: [],
    displayVoteCounter: true, displayOptions: {},
    ...(params.has("whisper") ? { speechAbilities: [{ name: "Whisper", verb: "to", targetType: "player", targets: ["p1", "p2"] }, { name: "Cry", verb: "", targetType: "out", targets: ["out"] }] } : {}),
    messages: [
      ["p1", "Morning. Did anyone learn anything last night?"],
      ["p4", "I was blocked. That's all I've got for now."],
      ["p2", "Let's hear everyone before we rush a vote."],
      ["p0", "Who was the last person to vote yesterday?"],
      ["p5", "Velvet, I think. I'll check the previous day."],
      ["p1", "That doesn't make them mafia. What about the timing?"],
    ].map(([senderId, content], i) => ({ id: `message${i}`, senderId, content, meetingId: "village", time: 1794000000000 + i * 60000, quotable: true })).concat(sentMessages.filter(message => message.meetingId === "village")),
    ...meetingOverrides,
  };
  const fixtureMeetings = { village: meeting, ...(params.has("multimeeting") ? { private: { ...meeting, id: "private", name: "Private", messages: sentMessages.filter(message => message.meetingId === "private") } } : {}) };
  const game = {
    gameId: "fixture", gameType: "Mafia", review: params.has("review"), self: "p0", players,
    isSpectator: params.has("spectator"), spectators: [], spectatorCount: 2,
    options: { spectating: true, ranked: params.has("ranked"), lobby: "Main" }, setup: { ...setup }, filters: {},
    dev: params.has("dev"),
    history: { currentState: params.has("completed") ? -2 : params.has("pregame") ? -1 : 1, states: {
      ...(params.has("pregame") ? { [-1]: { name: "Pregame", meetings: fixtureMeetings, selTab: "village", alerts: [], roles: {}, dead: {}, exorcised: {} } } : {}),
      ...(!params.has("pregame") ? { 1: { name: "Day 1", meetings: fixtureMeetings, selTab: selectedMeetings[1], alerts: [], roles: params.has("roles") ? { p0: "Cop", p1: "Villager", p2: "Mafioso" } : {}, dead: params.has("dead") ? { p6: true } : {}, exorcised: {} } } : {}),
      ...(params.has("history") ? { 0: { name: "Night 1", meetings: fixtureMeetings, selTab: selectedMeetings[0], alerts: [], roles: {}, dead: {}, exorcised: {} } } : {}),
      ...(params.has("completed") ? { [-2]: { name: "Postgame", meetings: fixtureMeetings, selTab: "village", alerts: [], roles: {}, dead: {}, exorcised: {}, winners: { groups: ["Village"] } } } : {}),
    } },
    stateViewing, updateHistory: action => { if (action.type === "selTab") setSelectedMeetings(previous => ({ ...previous, [action.state]: action.meetingId })); },
    updateStateViewing: action => setStateViewing(action.type === "current" ? (params.has("completed") ? -2 : params.has("pregame") ? -1 : 1) : action.type === "first" ? (params.has("pregame") ? -1 : params.has("history") ? 0 : 1) : action.stateNum),
    settings,
    socket, replyTarget, setReplyTarget,
    isolatedPlayers: new Set(), rolePredictions, getSetupGameSetting: name => (name === "Whispers" && params.has("whisper")) || (name === "Last Wills" && params.has("full")),
    loadAudioFiles: ignore, playAudio: ignore, stopAudio: ignore, stopDeathSounds: ignore,
    pinnedMessages: {}, lastWill: "", updateSettings: action => setSettings(action.settings), updateFilters: ignore,
    speechFilters: { from: "", contains: "" }, setSpeechFilters: ignore, setIsolationEnabled: ignore, togglePlayerIsolation: ignore,
    toggleRolePrediction: (id, role) => setRolePredictions(previous => ({ ...previous, [id]: role })),
    selectedPanel, setSelectedPanel, onLeaveGameClick: () => setLeaveOpen(true),
    isParticipant: true, unresolvedActionCount: 1, kudos: null, isMessagePinned: () => false,
  };
  const chat = <TextMeetingLayout />;
  return <GameContext.Provider value={game}><GameTypeContext.Provider value={{ singleState: false }}>
    <div className="game-session"><Stack className="game" sx={{ height: "100%" }}>
      {params.has("full") ? <MafiaGame /> : <>
      <TopBar />
      <ThreePanelLayout leftPanelContent={<PlayerList />} centerPanelContent={chat} rightPanelContent={<ActionList />} />
      <MobileLayout centerContent={chat} chatTab />
      </>}
      <LeaveGameDialog open={leaveOpen} onClose={() => setLeaveOpen(false)}
        onConfirm={() => { window.__leftFixtureGame = true; setLeaveOpen(false); }}
        isParticipationRequired={!game.isSpectator && !game.review} lockSeconds={game.options.ranked ? 10 : 2}
        isPenaltyEnforced={game.options.ranked} />
    </Stack></div>
  </GameTypeContext.Provider></GameContext.Provider>;
}

function App() {
  useAppViewport();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const route = useLocation();
  if (params.has("icons")) return <IconReview />;
  if (params.has("iconChoices")) return <IconChoicesReview />;
  if (params.has("pendingReview")) return <PendingReview />;
  if (params.has("dialog")) return <MinigameDialogReview />;
  if (params.has("drawingTools")) return <DrawToolsReview />;
  if (route.pathname.startsWith("/game/")) return <GameFixture />;
  return <DmFixture><SiteLayout header={<Header setShowAnnouncementTemporarily={setShowAnnouncement} />} footer={<Footer />}>
      <Announcement showAnnouncementTemporarily={showAnnouncement} setShowAnnouncementTemporarily={setShowAnnouncement} />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/learn/*" element={<Learn />} />
          <Route path="/community/*" element={<Community />} />
          <Route path="*" element={<LobbyBrowser />} />
        </Routes>
      </main>
   </SiteLayout>{params.has("dm") && <FloatingDmWindow />}</DmFixture>;
}

function MinigameDialogReview() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(true);
  window.__setDialogActive = setActive;
  const [amount, setAmount] = useState(20);
  const close = () => setOpen(false);
  const kind = params.get("dialog");
  const socket = { send: (event, data) => window.__sent.push([event, data]) };
  let content;
  if (kind === "liars-dice") content = <LiarsDiceRulesModal options={{ startingDice: 5, wildOnes: true, spotOn: true }} onClose={close} />;
  if (kind === "ratscrew") content = <RatscrewRulesModal options={{ sumToTen: true, marriageRule: true }} onClose={close} />;
  if (kind === "policy-peek") content = <PolicyPeekModal policies={["Liberal", "Fascist", "Liberal"]} onClose={close} />;
  if (kind === "loyalty") content = <LoyaltyRevealModal name="Juniper" alignment="Fascists" onClose={close} />;
  if (kind === "veto") content = <VetoAssentModal meeting={{ id: "veto", votes: {} }} socket={socket} />;
  if (kind === "poker-raise") content = <PokerRaisePopover minRaise={10} maxRaise={200} halfPot={40} fullPot={80} amount={amount} onAmountChange={setAmount} onConfirm={() => { window.__sent.push(["raise", amount]); close(); }} onCancel={close} callAmount={5} myBidding={10} />;
  return <div className="game" style={{ position: "fixed", inset: 0, padding: 24 }}>
    <h1>Minigame component review</h1>
    <button onClick={() => setOpen(true)}>Reopen dialog</button>
    <ViewActivityContext.Provider value={active}>{open && content}</ViewActivityContext.Provider>
  </div>;
}

function DrawToolsReview() {
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(25);
  const [eraseMode, setEraseMode] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState(true);
  const [turn, setTurn] = useState(1);
  window.__setDrawingHidden = setHidden;
  window.__setDrawingActive = setActive;
  window.__setDrawingTurn = setTurn;
  return <main style={{ height: "100dvh", overflow: "auto", padding: 16 }}>
    <h1>Drawing tools</h1>
    <p>Production toolbar component; no live canvas or transport.</p>
    <ViewActivityContext.Provider value={active}>
      <DrawTools key={turn} color={color} size={size} eraseMode={eraseMode}
        onColor={setColor} onSize={setSize} onErase={setEraseMode}
        onUndo={() => window.__sent.push(["undo"])} onClear={() => window.__sent.push(["clear"])} hidden={hidden} />
    </ViewActivityContext.Provider>
  </main>;
}

function PendingReview() {
  const [ready, setReady] = useState(false);
  window.__finishPending = () => setReady(true);
  return <main style={{ padding: 16 }}><h1>Loading state</h1>{ready ? <p data-ready-content>Content is ready.</p> : <UiPending />}</main>;
}

function IconChoicesReview() {
  const [selected, setSelected] = useState("all");
  const choices = [{ id: "current", label: "Previous · HackerNoon outline", license: "CC BY 4.0" }, ...iconChoices];
  return <main className="icon-choices-review" style={{ height: "100dvh", overflowY: "auto", padding: 20, background: "var(--scheme-color-sec)" }}>
    <h1>Choose the utility icons</h1>
    <p>Real upstream artwork. The sidebar below is the production component. Pixel role icons and the wordmark will not change.</p>
    <label>Preview <select aria-label="Preview icon family" value={selected} onChange={event => setSelected(event.target.value)}>
      <option value="all">All choices</option>{choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}
    </select></label>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 20 }}>
      {choices.filter(choice => selected === "all" || selected === choice.id).map(choice => <UiIconFamilyContext.Provider key={choice.id} value={choice.id === "current" ? { ...uiIconSets.hackernoon, id: "hackernoon" } : choice}>
        <section data-icon-choice={choice.id} style={{ padding: 12, border: "1px solid var(--scheme-color-border)", borderRadius: 8, background: "var(--scheme-color)" }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>{choice.label}</h2>
          <p style={{ fontSize: 12 }}>{choice.license}{choice.id === "pixel-solid" || choice.id === "current" ? " · Icons by HackerNoon" : ""}</p>
          <div style={{ height: 310, overflow: "hidden" }}><SiteNavigation /></div>
          <p>Actual 18px / 24px / 32px</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minHeight: 40 }}>{[18, 24, 32].map(size => <UiIcon key={size} name="games" size={size} />)}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBlock: 16 }}>{["chat", "people", "settings", "check", "emotes"].map(name => <UiIcon key={name} name={name} />)}</div>
          <div className="ui-action-row"><UiAction variant="primary">Join</UiAction><UiAction variant="ghost">Spectate</UiAction></div>
          <div className="ui-action-row" style={{ marginTop: 16 }}>
            <UiAction variant="primary" iconOnly aria-label={`${choice.label} Send`}><UiIcon name="send" /></UiAction>
            <UiAction iconOnly disabled aria-label={`${choice.label} Disabled Send`}><UiIcon name="send" /></UiAction>
          </div>
          <p style={{ fontSize: 12 }}>{choice.id === "pixel-solid" || choice.id === "current" ? "Games uses the library’s shapes symbol; this set has no controller icon." : "Games uses a controller. Curved artwork is antialiased, not forced onto a pixel grid."}</p>
        </section>
      </UiIconFamilyContext.Provider>)}
    </div>
  </main>;
}

function IconReview() {
  return <main className="pixel-icon-review" style={{ height: "100dvh", overflowY: "auto", padding: 24, background: "var(--scheme-color-sec)", color: "var(--scheme-color-text)" }}>
    <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Pixel utility icons</h1>
    <p style={{ margin: "0 0 16px", color: "var(--um-muted)" }}>Pixelarticons (MIT) / HackerNoon Regular (CC BY 4.0) / HackerNoon 2× · original library artwork</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(144px, 1fr))", gap: 8 }}>
      {Object.keys(pixelIconPaths).map(name => <section key={name} data-pixel-icon-example={name} style={{ padding: 12, minHeight: 92, border: "1px solid var(--scheme-color-border)", borderRadius: 6, background: "var(--scheme-color)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", height: 48 }}><UiIcon name={name} set="pixelarticons" size={24} label={name} /><UiIcon name={name} set="hackernoon" size={24} /><UiIcon name={name} set="hackernoon" size={48} /></div>
        <div style={{ fontSize: 12, marginTop: 8, color: "var(--um-muted)" }}>{name}</div>
      </section>)}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
      <UiAction iconOnly variant="primary" aria-label="Enabled Send"><UiIcon name="send" /></UiAction>
      <UiAction iconOnly variant="primary" aria-label="Disabled Send" disabled><UiIcon name="send" /></UiAction>
      <UiAction iconOnly variant="ghost" aria-label="Unselected favorite" aria-pressed="false"><UiIcon name="star" /></UiAction>
      <UiAction iconOnly variant="ghost" aria-label="Selected favorite" aria-pressed="true"><UiIcon name="starFilled" /></UiAction>
      <UiAction variant="danger-quiet"><UiIcon name="leave" /> Leave game</UiAction>
    </div>
  </main>;
}

function DmFixture({ children }) {
  const [open, setOpen] = useState(params.has("dm"));
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState(params.has("dmpos") ? { x: 800, y: 100 } : null);
  const [channelId, setChannelId] = useState("fixture-direct");
  return <DmWindowContext.Provider value={{ open, collapsed, pos, channelId, access: { locked: false }, unread: 0, close: () => setOpen(false), toggle: () => setOpen(value => !value), setCollapsed, setPos, setChannelId, setLiveUnread: ignore, refreshAccess: ignore }}>{children}</DmWindowContext.Provider>;
}

ReactDOM.render(<BrowserRouter><ThemeProvider theme={theme} defaultMode={light ? "light" : "dark"} noSsr>
  <CssBaseline /><UserContext.Provider value={user}><SiteInfoContext.Provider value={siteInfo}>
    <SheetProvider><ProfileSheetProvider><App /></ProfileSheetProvider></SheetProvider>
  </SiteInfoContext.Provider></UserContext.Provider>
</ThemeProvider></BrowserRouter>, document.getElementById("root"), () => { window.__redesignReady = true; });

/**
 * Perf harness: play a large Mafia game in-process with simulated players and
 * a busy chat, and report per-message server cost and websocket bytes.
 *
 *   NODE_ENV=development node scripts/perf/simulateGame.js [players] [msgsPerDay] [spectators]
 *   node --cpu-prof --cpu-prof-dir=/tmp/prof scripts/perf/simulateGame.js 20 300
 *
 * Needs the same Mongo/Redis as the dev stack (.env). Uses isTest games, so
 * nothing is written to the games collection. Spam rate limits are disabled
 * for the bots so the chat can be driven faster than real time.
 */
require("dotenv").config();
const shortid = require("shortid");
const { performance } = require("perf_hooks");
const db = require("../../db/db");
const redis = require("../../modules/redis");
const Spam = require("../../Games/core/Spam");
const Game = require("../../Games/types/Mafia/Game");
const User = require("../../Games/core/User");
const { TestSocket, stringifyMessage } = require("../../lib/sockets");

const PLAYERS = Number(process.argv[2] || 20);
const MSGS_PER_DAY = Number(process.argv[3] || 200);
const SPECTATORS = Number(process.argv[4] || 0);

Spam.rateLimit = () => false;
Spam.isRepeatedContentSpam = () => false;
Spam.isRepeatedSimilarContentSpam = () => false;

const stats = { frames: 0, bytes: 0, stringifyMs: 0, byEvent: {} };
let measuring = false;

// Behaves like lib/sockets Socket.send: every send serializes its own frame.
class CountingSocket extends TestSocket {
  send(eventName, data) {
    const t = performance.now();
    const frame = stringifyMessage(eventName, data);
    stats.stringifyMs += performance.now() - t;
    stats.frames++;
    stats.bytes += frame.length;
    if (process.env.SAMPLE === eventName && !stats.sampled && frame.length > 200) { stats.sampled = 1; console.error(frame.slice(0, 1500)); }
    const e = (stats.byEvent[eventName] ||= { frames: 0, bytes: 0 });
    e.frames++;
    e.bytes += frame.length;
    const actions = this.clientListeners[eventName];
    if (actions) for (const a of actions) a(data);
  }
}

const phrases = [
  "I think we should hear everyone's reasoning before voting.",
  "That claim doesn't add up, who did you check last night?",
  "lol",
  "Can the cop please come out now, we are running out of time",
  "I'm voting the quiet one, nobody has heard from them all day.",
  "No way that's the mafia, they were pushing the right lynch yesterday",
];

function roleSetup(n) {
  const mafia = Math.max(1, Math.round(n / 5));
  const roles = { Cop: 1, Doctor: 1, Mafioso: mafia };
  roles.Villager = n - mafia - 2;
  return { total: n, roles: [roles] };
}

(async () => {
  await db.promise;
  const users = [];
  for (let i = 0; i < PLAYERS; i++)
    users.push(
      new User({ id: shortid.generate(), socket: new CountingSocket(), name: `bot${i}`, settings: {}, isTest: true })
    );
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: roleSetup(PLAYERS),
      stateLengths: { Day: 10 * 60 * 1000, Night: 10 * 60 * 1000 },
      pregameCountdownLength: 0,
      spectating: SPECTATORS > 0,
    },
    isTest: true,
  });
  await game.init();
  const meetingsBySocket = new Map();
  for (const u of users) {
    const mine = new Map();
    meetingsBySocket.set(u.socket, mine);
    u.socket.onClientEvent("meeting", (m) => mine.set(m.name, m));
  }
  for (const u of users) await game.userJoin(u);
  for (let i = 0; i < SPECTATORS; i++) {
    const s = new User({ id: shortid.generate(), socket: new CountingSocket(), name: `spec${i}`, settings: {}, isTest: true });
    await game.userJoin(s, true);
  }

  const meetingsOf = (p) => meetingsBySocket.get(p.user.socket) || new Map();

  const speakTimes = [];
  const voteTimes = [];
  let days = 0;
  const t0 = performance.now();
  const mem0 = process.memoryUsage().heapUsed;
  while (!game.finished && days < 30) {
    await new Promise((r) => setTimeout(r, 20));
    const state = game.getStateName();
    const alive = game.players.filter((p) => p.alive);
    if (state === "Day") {
      days++;
      measuring = true;
      for (let i = 0; i < MSGS_PER_DAY; i++) {
        const p = alive[i % alive.length];
        const m = meetingsOf(p).get("Village");
        if (!m) continue;
        const t = performance.now();
        p.user.socket.sendToServer("speak", { content: `${phrases[i % phrases.length]} #${i}`, meetingId: m.id });
        speakTimes.push(performance.now() - t);
      }
      const target = alive.find((p) => p.role.alignment === "Mafia") || alive[0];
      for (const p of alive) {
        const m = meetingsOf(p).get("Village");
        if (!m || !p.alive) continue;
        const t = performance.now();
        p.user.socket.sendToServer("vote", { selection: target.id, meetingId: m.id });
        voteTimes.push(performance.now() - t);
      }
    } else if (state === "Night") {
      for (const p of alive) {
        for (const [name, m] of meetingsOf(p)) {
          if (name === "Village" || name === "Pregame") continue;
          const sel = m.name === "Mafia" ? (m.targets || []).find((t) => t !== "*") || "*" : "*";
          p.user.socket.sendToServer("vote", { selection: sel, meetingId: m.id });
        }
      }
    }
    const startedWait = Date.now();
    while (!game.finished && game.getStateName() === state) {
      await new Promise((r) => setTimeout(r, 5));
      if (process.env.DEBUG && Date.now() - startedWait > 3000) {
        console.log("stuck in", state, game.players.flatMap((p) => [...meetingsOf(p).values()].map((m) => `${m.name} ${JSON.stringify((m.targets || []).slice(0, 3))}`)).filter((x, i, a) => a.indexOf(x) === i));
        process.exit(2);
      }
    }
  }
  const wall = performance.now() - t0;
  const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(q * (s.length - 1))] || 0; };
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const history = JSON.stringify(game.history.getHistoryInfo(null, true));
  const out = {
    players: PLAYERS, spectators: SPECTATORS, days, finished: !!game.finished,
    wallMs: Math.round(wall),
    speak: { n: speakTimes.length, meanMs: +(sum(speakTimes) / speakTimes.length).toFixed(3), p50: +pct(speakTimes, 0.5).toFixed(3), p99: +pct(speakTimes, 0.99).toFixed(3) },
    vote: { n: voteTimes.length, meanMs: +(sum(voteTimes) / voteTimes.length).toFixed(3), p99: +pct(voteTimes, 0.99).toFixed(3), maxMs: +Math.max(...voteTimes).toFixed(2) },
    ws: { frames: stats.frames, MB: +(stats.bytes / 1e6).toFixed(2), stringifyMs: Math.round(stats.stringifyMs) },
    topEvents: Object.entries(stats.byEvent).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 8).map(([k, v]) => `${k}: ${v.frames} frames ${(v.bytes / 1e3).toFixed(0)} KB`),
    historyKB: Math.round(history.length / 1024),
    heapDeltaMB: +((process.memoryUsage().heapUsed - mem0) / 1e6).toFixed(1),
  };
  console.log(JSON.stringify(out, null, 2));
  await redis.deleteGame(game.id).catch(() => {});
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

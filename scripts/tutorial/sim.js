// Headless run of a tutorial storyline with a simulated human, no DB/redis.
//   node scripts/tutorial/sim.js <storyline> '<json actions>'
// actions: [{do:"optionId"} (performs that option through the real meeting/chat), {chat:"..."}, {vote:["Meeting", "Name"|"*"|"Yes"|"$expected"]}, {silent:true}]
// The simulated player clicks Continue whenever it is enabled (and, with
// opts.earlyContinue, also tries to click it before then).
// Each action answers the next guided step. Prints a JSON result line.
process.env.NODE_ENV = "test";
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
function stub(file, exports) {
  const id = require.resolve(path.resolve(ROOT, file));
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
stub("Games/games.js", { games: {}, deprecationCheck() {} });
stub("db/db.js", { promise: Promise.resolve(), conn: {} });
const noop = async () => {};
stub("modules/redis.js", new Proxy({}, { get: () => noop }));
stub("modules/pushNotifications.js", { unregisterUser() {}, registerUser() {}, notifyUsers: noop, notifyGameStarting: noop });
const errors = [];
stub("modules/logging.js", () => ({ info() {}, debug() {}, warn() {}, error: (e) => errors.push(String((e && e.stack) || e)) }));
require("mongoose").set("bufferCommands", false);

const Game = require(ROOT + "/Games/types/Mafia/Game");
const User = require(ROOT + "/Games/core/User");
const { TestSocket } = require(ROOT + "/lib/sockets");
const TutorialController = require(ROOT + "/Games/core/tutorial/TutorialController");

async function run(storyline, actions, opts = {}) {
  const game = new Game({
    id: "tut",
    hostId: "human",
    isTest: true,
    settings: {
      setup: TutorialController.setup(),
      private: true,
      noVeg: true,
      pregameCountdownLength: 0,
      stateLengths: { Day: 600000, Night: 600000 },
      tutorial: { storyline, timing: Object.assign({ chat: 0, beat: 1, silence: 2500, maxSilence: 2, vote: [0, 1], fastVote: [0, 1] }, opts.timing) },
    },
  });
  await game.init();
  const socket = new TestSocket();
  const human = new User({ id: "human", name: "Newbie", socket, settings: {}, isTest: true });
  const overlays = [];
  const alerts = [];
  const chat = [];
  let lastExample = null;
  let nexts = 0;
  let rejoin = null;
  socket.onClientEvent("tutorial", (d) => {
    overlays.push(d);
    if (d && d.hasNext && !opts.noNext)
      setTimeout(() => {
        nexts++;
        socket.sendToServer("tutorialNext");
      }, 2);
    if (d && d.example) lastExample = d.example;
  });
  const phases = [];
  let kudosEvents = 0;
  socket.onClientEvent("kudos", () => kudosEvents++);
  let continues = 0;
  socket.onClientEvent("tutorialPhase", (d) => {
    phases.push(d);
    if (opts.leaveAt && d.phase === opts.leaveAt) {
      setTimeout(() => socket.sendToServer("leave"), 5);
      return;
    }
    if (opts.earlyContinue && !d.canContinue) setTimeout(() => socket.sendToServer("tutorialContinue"), 2);
    if (d.canContinue && !opts.noContinue)
      setTimeout(() => {
        continues++;
        socket.sendToServer("tutorialContinue");
      }, 5);
  });
  socket.onClientEvent("message", (m) => {
    if (m && m.senderId === "server") alerts.push(m.content);
    else if (m) chat.push(m.content);
  });
  // Force a storyline's random branch (e.g. { branch: "cop" } sets data.target).
  if (opts.branch) game.tutorial.data.target = opts.branch;
  // Janitor / Lawyer: force which seat is cleaned on Night 1.
  if (opts.victim) game.tutorial.data.victim = opts.victim;
  await game.userJoin(human, false);

  const t = game.tutorial;
  const queue = actions.slice();
  let busy = false;
  let lastPending = null;
  const used = [];
  await new Promise((resolve) => {
    const deadline = Date.now() + (opts.timeoutMs || 15000);
    const tick = setInterval(() => {
      if (game.finished || t.failed || game._tutorialClosing || Date.now() > deadline) {
        clearInterval(tick);
        if (game.finished) {
          game.startKudosVote();
          game.castKudosVote(t.human(), "mvp", "x");
        }
        if (opts.leaveAfterFinish) socket.sendToServer("leave");
        return setTimeout(resolve, opts.leaveAfterFinish ? 300 : 20);
      }
      if (busy || !t.pending) return;
      // Answer only once the question is the step on screen.
      if (!(t.steps[0] && t.steps[0].pending === t.pending)) return;
      if (t.pending === lastPending) return;
      if (opts.rejoinAtPending && !rejoin) {
        // Refresh / come back: a new socket joins the same game as the same user.
        rejoin = { before: overlays[overlays.length - 1], got: [], phases: [] };
        const s2 = new TestSocket();
        s2.onClientEvent("tutorial", (d) => rejoin.got.push(d));
        s2.onClientEvent("tutorialPhase", (d) => rejoin.phases.push(d));
        const u2 = new User({ id: "human", name: "Newbie", socket: s2, settings: {}, isTest: true });
        busy = true;
        game.userJoin(u2).then(() => {
          s2.sendToServer("tutorialSync");
          setTimeout(() => {
            busy = false;
            socket.sendToServer = s2.sendToServer.bind(s2);
          }, 20);
        });
        return;
      }
      const action = queue.shift();
      if (!action) return;
      lastPending = t.pending;
      busy = true;
      used.push(action);
      const me = t.human();
      if (action.do) {
        // Act through the real game UI: vote in the meeting or type in chat.
        const opt = t.pending.options.find((o) => o.id === action.do) || t.pending.options[0];
        if (opt.vote) {
          const meeting = t.meetingFor(me, opt.vote.meeting);
          let selection;
          if (opt.vote.target === "*other") {
            const taken = t.pending.options
              .filter((o) => o.vote && o.vote.meeting === opt.vote.meeting && o.vote.target !== "*other")
              .map((o) => t.selectionFor(o.vote.target));
            const pick = ["v1", "v3", "v2", "journalist", "sheriff", "cop"]
              .map((k) => t.player(k))
              .find((p) => p && p.alive && p !== me && !taken.includes(p.id));
            selection = pick ? pick.id : t.selectionFor("v1");
          } else selection = t.selectionFor(opt.vote.target);
          if (meeting) socket.sendToServer("vote", { meetingId: meeting.id, selection });
          setTimeout(() => {
            if (t.pending === lastPending) lastPending = null;
          }, 15);
        } else {
          const meeting = t.meetingFor(me, t.pending.meeting);
          const content = opt.say || opt.sample;
          if (meeting) socket.sendToServer("speak", { meetingId: meeting.id, content });
          setTimeout(() => {
            if (t.pending === lastPending) lastPending = null;
          }, 1250);
        }
      } else if (action.chat) {
        const meeting = t.meetingFor(me, t.pending.meeting);
        const content = action.chat === "$example" ? lastExample : action.chat;
        socket.sendToServer("speak", { meetingId: meeting.id, content });
      } else if (action.vote) {
        const [name, target] = action.vote;
        const meeting = t.meetingFor(me, name);
        const p = t.players().find((x) => x.name === target);
        let selection = p ? p.id : target;
        // "$expected": whatever the current step asks for.
        if (target === "$expected") selection = t.selectionFor(t.pending.options[0].vote.target);
        if (meeting) socket.sendToServer("vote", { meetingId: meeting.id, selection });
        // A rejected vote leaves the same step pending: allow the next action.
        setTimeout(() => {
          if (t.pending === lastPending) lastPending = null;
        }, 15);
      }
      // A chat that doesn't match leaves the same step pending: allow the next action.
      if (action.chat)
        setTimeout(() => {
          if (t.pending === lastPending) lastPending = null;
        }, 1250);
      const chatty = action.chat || action.silent || (action.do && !(t.pending && t.pending.options.find((o) => o.id === action.do && o.vote)));
      setTimeout(() => (busy = false), chatty ? 1300 : 25);
    }, 3);
  });

  const result = {
    storyline,
    finished: !!game.finished,
    winners: game.winners ? Object.keys(game.winners.groups) : null,
    branch: t.branch || (t.data && t.data.victim) || null,
    humanAlive: t.human().alive,
    failed: !!t.failed,
    closed: !!game._tutorialClosing,
    postgameOver: !!game.postgameOver,
    kudosStarted: !!game.kudosVote,
    kudosEvents: kudosEvents,
    state: game.getStateInfo().name,
    continues,
    nexts,
    phases: phases.length,
    voteTimes: t.voteTimes || [],
    highlights: overlays.filter((o) => o && o.highlight).map((o) => o.highlight),
    examples: overlays.filter((o) => o && o.examples).map((o) => o.examples),
    buttons: overlays.filter((o) => o && o.choices).length,
    lastOverlay: overlays[overlays.length - 1],
    leftoverActions: queue.length,
    // Cap log/alerts so parent test runners don't truncate the JSON line.
    log: (t.log || []).slice(-400),
    alerts: alerts.slice(-200),
    chat: chat.slice(-100),
    overlays: overlays.length,
    rejoin,
    errors,
  };
  t.destroy();
  for (const timer of Object.values(game.timers || {})) timer && timer.clear && timer.clear();
  return result;
}

module.exports = { run };

if (require.main === module) {
  run(process.argv[2], JSON.parse(process.argv[3] || "[]"), JSON.parse(process.argv[4] || "{}")).then((r) => {
    console.log(JSON.stringify(r));
    process.exit(0);
  });
}

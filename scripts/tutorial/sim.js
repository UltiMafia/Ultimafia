// Headless run of a tutorial storyline with a simulated human, no DB/redis.
//   node scripts/tutorial/sim.js <storyline> '<json actions>'
// actions: [{chat:"..."}, {vote:["Meeting", "Name"|"*"|"Yes"]}, {silent:true}]
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
      tutorial: { storyline, timing: Object.assign({ chat: 0, beat: 1, silence: 2500, maxSilence: 2 }, opts.timing) },
    },
  });
  await game.init();
  const socket = new TestSocket();
  const human = new User({ id: "human", name: "Newbie", socket, settings: {}, isTest: true });
  const overlays = [];
  const alerts = [];
  const chat = [];
  let lastExample = null;
  socket.onClientEvent("tutorial", (d) => {
    overlays.push(d);
    if (d && d.example) lastExample = d.example;
  });
  socket.onClientEvent("message", (m) => {
    if (m && m.senderId === "server") alerts.push(m.content);
    else if (m) chat.push(m.content);
  });
  // Force a storyline's random branch (e.g. { branch: "cop" } sets data.target).
  if (opts.branch) game.tutorial.data.target = opts.branch;
  await game.userJoin(human, false);

  const t = game.tutorial;
  const queue = actions.slice();
  let busy = false;
  let lastPending = null;
  const used = [];
  await new Promise((resolve) => {
    const deadline = Date.now() + (opts.timeoutMs || 15000);
    const tick = setInterval(() => {
      if (game.finished || Date.now() > deadline) {
        clearInterval(tick);
        return setTimeout(resolve, 20);
      }
      if (busy || !t.pending) return;
      if (t.pending === lastPending && t.pending.kind === "vote") return;
      const action = queue.shift();
      if (!action) return;
      lastPending = t.pending;
      busy = true;
      used.push(action);
      const me = t.human();
      if (action.chat) {
        const meeting = t.meetingFor(me, t.pending.meeting);
        const content = action.chat === "$example" ? lastExample : action.chat;
        socket.sendToServer("speak", { meetingId: meeting.id, content });
      } else if (action.vote) {
        const [name, target] = action.vote;
        const meeting = t.meetingFor(me, name);
        const p = t.players().find((x) => x.name === target);
        let selection = p ? p.id : target;
        // "$expected": whatever the current step asks for.
        if (target === "$expected") selection = t.selectionFor(t.pending.options[0].target);
        if (meeting) socket.sendToServer("vote", { meetingId: meeting.id, selection });
        // A rejected vote leaves the same step pending: allow the next action.
        setTimeout(() => {
          if (t.pending === lastPending) lastPending = null;
        }, 15);
      }
      setTimeout(() => (busy = false), action.chat || action.silent ? 1300 : 25);
    }, 3);
  });

  const result = {
    storyline,
    finished: !!game.finished,
    winners: game.winners ? Object.keys(game.winners.groups) : null,
    branch: t.branch,
    humanAlive: t.human().alive,
    leftoverActions: queue.length,
    log: t.log,
    alerts,
    chat,
    overlays: overlays.length,
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

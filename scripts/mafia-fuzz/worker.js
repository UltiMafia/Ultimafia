// Service substitutions are installed only in this disposable child process.
process.env.NODE_ENV = "test";
const path = require("path");
function stub(file, exports) {
  const id = require.resolve(path.resolve(__dirname, "../..", file));
  require.cache[id] = { id, filename: id, loaded: true, exports };
}
let report = { trace: [], states: [], status: "initializing" };
function checkpoint() { if (process.send) process.send(report); }
function fail(error) {
  report.status = "failure";
  report.error = error?.stack || String(error);
  if (process.send) process.send(report, () => process.exit(1));
  else process.exit(1);
}
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);
stub("Games/games.js", { games: {}, deprecationCheck() {} });
stub("db/db.js", { promise: Promise.resolve(), conn: {} });
const noop = async () => {};
const redis = {};
for (const name of ["createGame", "joinGame", "inGame", "setGameHost",
  "setSpectatorCount", "leaveGame", "deleteGame", "setGameStatus",
  "setGameState", "setWinnersInfo"]) redis[name] = noop;
stub("modules/redis.js", redis);
stub("modules/pushNotifications.js", {
  unregisterUser() {}, registerUser() {}, notifyUsers: noop,
});
stub("modules/logging.js", () => ({
  info() {}, debug() {}, warn() {}, error: fail,
}));
// Reject accidental persistence/network access rather than silently accepting it.
require("mongoose").set("bufferCommands", false);
const { random, selections } = require("./generator");
process.on("message", async (input) => {
  report = { ...input, status: "running", trace: [], states: [] };
  delete report.error;
  checkpoint();
  const rng = random(input.seed);
  Math.random = rng;
  require("../../lib/Random").randFloat = rng;
  let id = 0;
  require("shortid").generate = () => `fuzz${id++}`;
  const Game = require("../../Games/types/Mafia/Game");
  const User = require("../../Games/core/User");
  const Socket = require("../../lib/sockets").TestSocket;
  const game = new Game({ id: "fuzz-game", hostId: "user0", isTest: true,
    settings: { setup: input.setup, pregameCountdownLength: 0,
      stateLengths: { Day: 60000, Night: 60000, "Team Approval": 60000, Mission: 60000 } } });
  // Use real Timer objects but advance deadlines explicitly between action batches.
  const Timer = require("../../Games/core/Timer");
  Timer.prototype.start = function () { this.startTime = Date.now(); };
  game.handleError = fail;
  await game.init();
  for (let i = 0; i < input.setup.total; i++) {
    await game.userJoin(new User({ id: `user${i}`, name: `Player${i}`,
      socket: new Socket(), settings: {}, isTest: true }), true);
  }
  await new Promise(setImmediate);
  if (!game.started) throw new Error("Game did not start");
  for (let step = 0; step < input.maxSteps && !game.finished; step++) {
    report.states.push(game.getStateInfo().name);
    checkpoint();
    const state = game.currentState;
    for (const meeting of [...game.meetings]) {
      for (const member of Object.values(meeting.members)) {
        if (game.finished || game.currentState !== state) break;
        const player = member.player;
        const info = meeting.getMeetingInfo(player);
        for (const selection of selections(info, meeting, rng)) {
          if (game.finished || game.currentState !== state) break;
          report.trace.push({ state, player: player.id, role: player.role.name,
            meeting: meeting.name, meetingId: meeting.id, selection });
          checkpoint();
          player.user.socket.sendToServer("vote", { meetingId: meeting.id, selection });
        }
      }
    }
    if (!game.finished && game.currentState === state) {
      if (!game.timers.main) throw new Error("No main timer in active game");
      report.trace.push({ state, timer: "main" });
      checkpoint();
      game.timers.main.end();
    }
    await new Promise(setImmediate);
    if (!game.finished && game.currentState === state)
      throw new Error("Game did not advance after its deadline");
  }
  // A long, valid game is a budget exhaustion, not evidence of a crash.
  report.status = game.finished ? "finished" : "bounded";
  game.clearTimers();
  process.send(report, () => process.exit(0));
});

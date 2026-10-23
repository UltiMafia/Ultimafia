const Random = require("../../lib/Random");
const constants = require("../../data/constants");

const limits = constants.devApi;

function scaleTimerDelay(delay, scale) {
  if (!(scale > 0) || scale >= 1 || !(delay > 0)) return delay;
  return Math.max(limits.minScaledTimerMs, Math.round(delay * scale));
}

function playerKey(player, forced) {
  if (forced[player.id] !== undefined) return player.id;
  if (forced[player.name] !== undefined) return player.name;
  if (player.user && forced[player.user.id] !== undefined) return player.user.id;
}

function orderPlayersForForcedRoles(players, roleset, forced) {
  const slots = [];
  for (const roleName in roleset)
    for (let j = 0; j < roleset[roleName]; j++) slots.push(roleName);

  const ordered = new Array(slots.length).fill(null);
  const unforced = [];
  for (const player of players) {
    const key = playerKey(player, forced);
    const wanted = key === undefined ? -1 : slots.findIndex(
      (slot, i) => ordered[i] === null && slot.split(":")[0] === String(forced[key]).split(":")[0]
    );
    if (wanted == -1) unforced.push(player);
    else ordered[wanted] = player;
  }
  for (let i = 0; i < ordered.length; i++)
    if (ordered[i] === null) ordered[i] = unforced.shift() || null;
  return ordered.filter(Boolean).concat(unforced);
}

function advanceOnce(game, veg) {
  if (!game.started || game.finished) throw new Error("The game is not running.");
  if (!veg) for (const meeting of game.meetings) meeting.noVeg = true;
  game.gotoNextState();
}

function pauseTimer(timer) {
  if (timer.done || timer.pausedLeft !== undefined) return;
  timer.pausedLeft = Math.max(0, timer.timeLeft());
  timer.clear();
}

function resumeTimer(timer) {
  if (timer.pausedLeft === undefined) return;
  timer.delay = timer.pausedLeft;
  delete timer.pausedLeft;
  timer.restart();
}

function startTimer(game, timer) {
  if (game.devControls.paused) {
    timer.pausedLeft = timer.delay;
    timer.done = true;
  } else timer.start();
}

function setLife(game, refs, makeAlive) {
  for (const ref of refs || []) {
    const player = findPlayer(game, ref);
    if (!player) throw new RangeError(`Player not found: ${ref}`);
    if (makeAlive && !player.alive) player.revive("basic", null, true);
    if (!makeAlive && player.alive) player.kill("basic", null, true);
  }
}

function findPlayer(game, ref) {
  return game.players.array().find((p) => p.id == ref || p.name == ref);
}

function snapshot(game) {
  return {
    id: game.id,
    lobby: game.lobby,
    started: game.started,
    finished: game.finished,
    state: game.started ? game.getStateInfo().name : "Pregame",
    paused: Boolean(game.devControls.paused),
    timerScale: game.devControls.timerScale,
    seed: game.devControls.seed,
    forcedRoles: game.devControls.forcedRoles,
    players: game.players.array().map((p) => ({
      id: p.id,
      name: p.name,
      alive: p.alive,
      left: p.left,
      role: p.role ? p.role.name : null,
      alignment: p.role ? p.role.alignment : null,
    })),
  };
}

const commands = {
  state: (game) => snapshot(game),
  timerScale: (game, { scale }) => {
    scale = Number(scale);
    if (!(scale >= limits.minTimerScale && scale <= 1))
      throw new RangeError(`scale must be between ${limits.minTimerScale} and 1.`);
    game.devControls.timerScale = scale;
    return snapshot(game);
  },
  seed: (game, { seed }) => {
    if (game.started) throw new Error("The seed must be set before the game starts.");
    game.devControls.seed = seed == null ? null : String(seed).slice(0, 100);
    return snapshot(game);
  },
  forceRoles: (game, { roles }) => {
    if (game.started) throw new Error("Roles must be forced before the game starts.");
    game.devControls.forcedRoles = Object.assign({}, roles);
    return snapshot(game);
  },
  advance: (game, { veg }) => {
    advanceOnce(game, veg);
    return snapshot(game);
  },
  step: (game) => {
    if (!game.devControls.paused) throw new Error("Pause the clock before stepping.");
    advanceOnce(game, false);
    return snapshot(game);
  },
  pause: (game) => {
    if (!game.devControls.paused) {
      game.devControls.paused = true;
      for (const timer of Object.values(game.timers)) pauseTimer(timer);
    }
    return snapshot(game);
  },
  resume: (game) => {
    if (game.devControls.paused) {
      game.devControls.paused = false;
      for (const timer of Object.values(game.timers)) resumeTimer(timer);
    }
    return snapshot(game);
  },
  jumpTo: (game, { state, dead, alive }) => {
    if (!game.started || game.finished) throw new Error("The game is not running.");
    const target = String(state || "");
    for (let i = 0; game.getStateInfo().name != target; i++) {
      if (i >= limits.maxJumpStates || game.finished)
        throw new Error(`Could not reach ${target}; stopped at ${game.getStateInfo().name}.`);
      advanceOnce(game, false);
    }
    setLife(game, dead, false);
    setLife(game, alive, true);
    game.checkGameEnd();
    return snapshot(game);
  },
  kill: (game, { player }) => {
    const target = findPlayer(game, player);
    if (!target || !game.started) throw new Error("Player not found in a running game.");
    target.kill("basic", null, true);
    game.checkGameEnd();
    return snapshot(game);
  },
  revive: (game, { player }) => {
    const target = findPlayer(game, player);
    if (!target || !game.started) throw new Error("Player not found in a running game.");
    target.revive("basic", null, true);
    return snapshot(game);
  },
  alert: (game, { message }) => {
    game.sendAlert(String(message).slice(0, 500));
    return snapshot(game);
  },
};

function runDevControl(game, command, args) {
  if (game.lobby != constants.testingLobby)
    throw new Error("Developer controls only work in the Testing lobby.");
  const run = commands[command];
  if (!run) throw new Error(`Unknown command: ${command}`);
  return run(game, args || {});
}

function withDevSeed(game, fn) {
  const seed = game.devControls.seed;
  return seed == null ? fn() : Random.withSource(Random.seededSource(seed), fn);
}

module.exports = {
  scaleTimerDelay,
  orderPlayersForForcedRoles,
  runDevControl,
  withDevSeed,
  startTimer,
  commandNames: Object.keys(commands),
};

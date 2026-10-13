require("../../scripts/mafia-fuzz/worker");
const assert = require("assert/strict");
const EventEmitter = require("events");
const Game = require("../../Games/core/Game");
const MafiaGame = require("../../Games/types/Mafia/Game");
const Player = require("../../Games/core/Player");
const Action = require("../../Games/core/Action");
const Information = require("../../Games/types/Mafia/Information");

function player(game, immune = false) {
  const p = Object.create(Player.prototype);
  Object.assign(p, { game, alive: true, role: { data: { deathChance: 500 } },
    user: { id: "test" }, getImmunity: () => immune ? 100 : 0,
    getCancelImmunity: () => 0, kill() { this.alive = false; } });
  return p;
}

async function run(scenario) {
  const game = { events: new EventEmitter(), getStateName: () => "Day" };
  if (scenario === "unlucky") {
    const Card = require("../../Games/types/Mafia/roles/cards/UnluckyDeath");
    require("../../lib/Random").randInt = () => 0;
    for (const listener of ["state", "death"]) {
      for (const immune of [false, true]) {
        const p = player(game, immune);
        game.alivePlayers = () => [p, {}, {}];
        const role = { player: p, game };
        const card = new Card(role);
        card.listeners[listener].call(role);
        assert.equal(p.alive, immune, listener + " must respect kill immunity");
        // No repeated kill when the listener receives another death event.
        p.alive = false;
        p.kill = () => assert.fail("Killed an already-dead player");
        card.listeners[listener].call(role);
      }
    }
  } else if (scenario === "watcher") {
    const vulnerable = player(game);
    const protectedPlayer = player(game, true);
    protectedPlayer.docImmunity = [{ saver: "doctor" }];
    let events = 0;
    game.events.on("immune", () => events++);
    const makeAction = target => {
      const action = new Action({ game, target, labels: ["kill"], run() {} });
      action.docSave = () => assert.fail("Information query persisted a Doctor save");
      return action;
    };
    game.actions = [[makeAction([vulnerable, protectedPlayer, null, "No"]), makeAction("No")]];
    const info = new Information("test", null, game);
    assert.deepEqual(info.getKillVictims(), [vulnerable]);
    assert.equal(events, 0);
    game.actions = [[makeAction(vulnerable)]];
    assert.deepEqual(info.getKillVictims(), [vulnerable]);
    let saves = 0;
    const liveAction = makeAction(protectedPlayer);
    liveAction.docSave = () => saves++;
    assert.equal(liveAction.dominates(), false);
    assert.equal(events, 1);
    assert.equal(saves, 1);
  } else if (scenario === "incubus") {
    const Card = require("../../Games/types/Mafia/roles/cards/ConvertToChosenRoleOnDeath");
    const victim = player(game);
    let effects = 0;
    const role = { game, data: { targetPlayer: victim }, giveEffect() { effects++; } };
    const card = new Card(role);
    const convert = card.meetings["Role to Become"].action.run;
    convert.call({ role, target: "None" });
    assert.equal(role.data.targetPlayer, undefined);
    convert.call({ role, target: "Villager", dominates: () => true });
    assert.equal(effects, 0, "Abstaining must not reuse an earlier target");
    role.data.targetPlayer = victim;
    convert.call({ role, target: "Villager", dominates: () => true });
    assert.equal(effects, 1);
    assert.equal(role.data.targetPlayer, undefined);
    role.data.targetPlayer = victim;
    convert.call({ role, target: "Villager", dominates: () => false });
    assert.equal(role.data.targetPlayer, undefined);
  } else if (scenario === "state-search") {
    const g = Object.create(Game.prototype);
    g.states = [{}, {}, { skipChecks: [() => true] }, { skipChecks: [() => true] }];
    g.stateIndexRecord = [2];
    g.stateOffset = 0;
    assert.equal(g.getNextStateIndex()[0], null);
    g.states[3].skipChecks = [() => false];
    assert.equal(g.getNextStateIndex()[0], 3);
    g.states = [{}, {}];
    assert.equal(g.getNextStateIndex()[0], null);
    g.currentState = 8;
    let ended = false;
    g.endForNoPlayableState = () => { ended = true; };
    g.incrementState();
    assert.equal(ended, true);
    assert.equal(g.currentState, 8);
    assert.deepEqual(g.stateIndexRecord, [2]);
  } else if (scenario === "state-end") {
    const User = require("../../Games/core/User");
    const Socket = require("../../lib/sockets").TestSocket;
    require("../../Games/core/Timer").prototype.start = function () { this.startTime = Date.now(); };
    const g = new MafiaGame({ id: "state-end", hostId: "p0", isTest: true,
      settings: { setup: { total: 5, roles: [{ Villager: 4, Mafioso: 1 }] },
        stateLengths: { Day: 60000, Night: 60000 } } });
    await g.init();
    for (let i = 0; i < 5; i++) await g.userJoin(new User({ id: "p" + i, name: "P" + i,
      socket: new Socket(), settings: {}, isTest: true }), true);
    await new Promise(setImmediate);
    assert.equal(g.started, true);
    const record = [...g.stateIndexRecord];
    for (const state of g.states.slice(2)) state.skipChecks = [() => true];
    g.gotoNextState();
    await new Promise(setImmediate);
    assert.equal(g.finished, true);
    assert.equal(g.currentState, -2);
    assert.deepEqual(g.stateIndexRecord, record);
    assert.deepEqual(Object.keys(g.winners.groups), ["No one"]);
    assert.deepEqual(Object.keys(g.timers), []);
  } else throw new Error("Unknown scenario " + scenario);
}
run(process.argv[2]).then(() => process.exit(0)).catch(error => {
  console.error(error.stack);
  process.exit(1);
});

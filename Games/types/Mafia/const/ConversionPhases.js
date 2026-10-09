const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_CONVERT_DEFAULT } = require("./Priority");

const CONVERSION_PHASES = [
  {
    name: "Night (Becoming)",
    length: 45000,
    roles: ["Philosopher", "Associate", "Egg"],
  },
  {
    name: "Night (Swapping)",
    length: 45000,
    roles: ["Snake Charmer", "Old Maid", "Mediator", "Stylist"],
  },
  {
    name: "Night (Converting)",
    length: 45000,
    roles: ["Mi-Go"],
  },
];

function phaseByName(name) {
  for (let phase of CONVERSION_PHASES) {
    if (phase.name == name) return phase;
  }
  return null;
}

function isConversionNightPhase(name) {
  return phaseByName(name) != null;
}

// Listeners are copied onto the role in Card.init and bound to the role.
function attachConversionPhase(card, phaseName) {
  card.listeners = card.listeners || {};
  card.listeners.extraStateCheck = function (stateName) {
    if (stateName != phaseName) return;
    if (!this.player || !this.player.alive) return;
    if (this.player.role !== this) return;

    const phase = phaseByName(phaseName);
    if (!phase || !phase.roles.includes(this.name)) return;
    if (this.game.ExtraStates == null) this.game.ExtraStates = [];
    if (!this.game.ExtraStates.includes(phaseName)) {
      this.game.ExtraStates.push(phaseName);
    }
  };
}

function killIsBlocked(action, player) {
  if (player.getImmunity("kill") >= 1) return true;
  return action.getVisitors(player, "save").length > 0;
}

function cancelKillActions(game, player) {
  const queue = game.actions && game.actions[0];
  if (!queue) return;

  for (let action of queue) {
    if (action.actor !== player) continue;
    if (!action.hasLabel("kill")) continue;
    if (action.hasLabel("absolute")) continue;
    action.cancel(true);
  }
}

function queueDirectDeath(game, player) {
  if (!player) return;

  game.queueAction(
    new Action({
      game: game,
      actor: player,
      target: player,
      priority: PRIORITY_CONVERT_DEFAULT + 4,
      labels: ["hidden", "absolute"],
      power: 5,
      run: function () {
        if (this.target && this.target.alive) {
          this.target.kill("basic", this.actor);
        }
      },
    }),
    true
  );
}

// Runs at PRIORITY_NIGHT_SAVER + 1 during main Night.
function resolveMigoOldDemons(game) {
  const newcomers = game.migoNewDemons || [];
  game.migoNewDemons = [];
  if (Array.isArray(game.nightOrderTrace)) {
    game.nightOrderTrace.push("migo-check");
  }
  if (newcomers.length == 0) return;

  const newcomerPlayers = newcomers.map((entry) => entry.player);
  let oldDemons = game
    .alivePlayers()
    .filter(
      (player) =>
        game.isDemonPlayer(player) && newcomerPlayers.indexOf(player) == -1
    );

  const probe = new Action({
    game: game,
    actor: newcomers[0].actor,
    labels: ["kill", "hidden"],
    power: 1,
    run: function () {},
  });

  for (let entry of newcomers) {
    oldDemons = oldDemons.filter(
      (player) => player.alive && player !== entry.player
    );
    if (oldDemons.length == 0) continue;

    const unprotected = oldDemons.filter(
      (player) => !killIsBlocked(probe, player)
    );
    const pool = unprotected.length > 0 ? unprotected : oldDemons;
    const chosen = Random.randArrayVal(pool);
    const chosenIsProtected = unprotected.indexOf(chosen) == -1;

    if (chosenIsProtected) {
      cancelKillActions(game, chosen);
      queueDirectDeath(game, entry.player);
    } else {
      queueDirectDeath(game, chosen);
    }

    oldDemons = oldDemons.filter((player) => player !== chosen);
  }
}

module.exports = {
  CONVERSION_PHASES,
  phaseByName,
  isConversionNightPhase,
  attachConversionPhase,
  resolveMigoOldDemons,
};

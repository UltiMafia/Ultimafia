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

// Phase presence is decided from the setup, not from who is currently alive.
// Keeping the hook so the cards still name the phase they meet in.
function attachConversionPhase(card, phaseName) {
  card.conversionPhase = phaseName;
}

function setupRoleNames(game) {
  const names = new Set();
  const add = (role) => {
    if (!role) return;
    names.add(String(role).split(":")[0]);
  };

  for (let role of game.PossibleRoles || []) add(role);

  const collectRoleset = (roleset) => {
    if (!roleset) return;
    if (Array.isArray(roleset)) {
      for (let role of roleset) add(role);
      return;
    }
    if (typeof roleset == "object") {
      for (let role of Object.keys(roleset)) add(role);
    }
  };

  if (game.setup && Array.isArray(game.setup.roles)) {
    for (let roleset of game.setup.roles) collectRoleset(roleset);
  }
  if (game.setup && game.setup.closedRoles) {
    const closed = game.setup.closedRoles;
    if (Array.isArray(closed)) {
      for (let roleset of closed) collectRoleset(roleset);
    } else {
      collectRoleset(closed);
    }
  }

  return names;
}

function setupUsesPhase(game, phaseName) {
  const phase = phaseByName(phaseName);
  if (!phase) return false;
  const names = setupRoleNames(game);
  for (let roleName of phase.roles) {
    if (names.has(roleName)) return true;
  }
  return false;
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
// A non-Demon turned into a Demon: the chosen old Demon's kill does not land.
// A Demon turned into another Demon: the new Demon's kill does not land.
function resolveMigoOldDemons(game) {
  const newcomers = game.migoNewDemons || [];
  const suppressed = game.migoSuppressedDemons || [];
  game.migoNewDemons = [];
  game.migoSuppressedDemons = [];
  if (Array.isArray(game.nightOrderTrace)) {
    game.nightOrderTrace.push("migo-check");
  }

  for (let player of suppressed) {
    cancelKillActions(game, player);
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

    // The chosen old Demon's kill never lands on the conversion night.
    // Protection only decides who dies: the old Demon, or the new one.
    cancelKillActions(game, chosen);
    if (chosenIsProtected) {
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
  setupUsesPhase,
  resolveMigoOldDemons,
};

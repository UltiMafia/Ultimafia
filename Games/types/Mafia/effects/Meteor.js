const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");

module.exports = class Meteor extends Effect {
  constructor(lifespan) {
    super("Meteor");
    this.lifespan = lifespan;

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
      },
      death: function (player, killer, deathType, instant) {
        this.remove();
      },
      afterActions: function () {
        if (
          this.game.getStateName() == "Night" ||
          this.game.getStateName() == "Dawn"
        ) {
          return;
        }
        for (let player of this.game.alivePlayers()) {
          player.kill("basic");
        }
        this.game.MeteorLanded = true;
      },
      handleWinBlockers: function (winners) {
        if (
          this.game.getStateName() == "Night" ||
          this.game.getStateName() == "Dawn"
        ) {
          return;
        }
        let AllPlayers = this.game.players.filter((p) => p);
        for (let y = 0; y < AllPlayers.length; y++) {
          if (
            winners.groups[AllPlayers[y].faction] ||
            winners.groups[AllPlayers[y].role.name]
          ) {
            if (
              this.game.getRoleAlignment(AllPlayers[y].role.name) ==
              "Independent"
            ) {
              winners.removeGroup(AllPlayers[y].role.name);
            } else {
              winners.removeGroup(AllPlayers[y].faction);
            }
          }
        }
      },
    };
  }
};

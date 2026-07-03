const Effect = require("../Effect");

module.exports = class Meteor extends Effect {
  constructor(lifespan) {
    super("Meteor");
    this.lifespan = lifespan ?? Infinity;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        const warningPhase = this.game.meteorWarningPhase || "Day";

        if (warningPhase === "Day" && deathType !== "condemn") {
          return;
        }

        this.remove();
      },
      afterActions: function () {
        const stateName = this.game.getStateName();
        const warningPhase = this.game.meteorWarningPhase || "Day";

        if (stateName !== warningPhase) {
          return;
        }

        this.game.queueAlert("A giant meteor obliterates the town!");

        for (let player of [...this.game.alivePlayers()]) {
          player.kill("basic", null, true);
        }
        this.game.MeteorLanded = true;
        this.remove();

        var [finished, winners] = this.game.checkWinConditions();
        if (!finished || winners.groupAmt() <= 0) {
          winners.addGroup("No one");
        }
        this.game.endGame(winners);
      },
      handleWinBlockers: function (winners) {
        if (!this.game.MeteorLanded) {
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

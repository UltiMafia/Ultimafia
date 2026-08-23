const Effect = require("../Effect");

module.exports = class Meteor extends Effect {
  constructor(lifespan) {
    super("Meteor");
    this.lifespan = lifespan ?? Infinity;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (this.game.MeteorLanded) {
          return;
        }

        const warningPhase = this.game.meteorWarningPhase || "Day";

        if (warningPhase === "Day" && deathType !== "condemn") {
          return;
        }

        this.remove();
      },
      afterActions: function () {
        if (this.game.MeteorLanded) {
          return;
        }

        const stateName = this.game.getStateName();
        const warningPhase = this.game.meteorWarningPhase || "Day";

        if (stateName !== warningPhase) {
          return;
        }

        this.game.MeteorLanded = true;
        this.game.queueAlert("A giant meteor obliterates the town!");

        // Non-instant: instant kill calls checkAllMeetingsReady -> gotoNextState
        // mid-loop, which can end the game before remaining players are killed
        // and drop their obituaries (bots look like they never died).
        for (let player of [...this.game.alivePlayers()]) {
          player.kill("basic", null, false);
        }

        var [, winners] = this.game.checkWinConditions();
        for (let group of Object.keys(winners.groups)) {
          if (group !== "No one") {
            winners.removeGroup(group);
          }
        }
        winners.addGroup("No one");
        this.remove();
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

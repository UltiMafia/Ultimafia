const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfPrescientVote extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = 0;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners) {
        if (
          this.player.alive &&
          !winners.groups[this.name] &&
          this.predictedCorrect >= 2
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
        if(this.predictedVote == "*"){
          return;
        }
        var action = new Action({
          role: this,
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_DAY_EFFECT_DEFAULT + 1,
          labels: ["hidden", "absolute"],
          role: role,
          run: function () {
            let alivePlayers = this.game.players.filter((p) => p.role);
            for (let x = 0; x < alivePlayers.length; x++) {
              for (let action of this.game.actions[0]) {
                if (
                  action.target == alivePlayers[x] &&
                  action.hasLabel("condemn") && 
                ) {
                  return;
                }
              }
            }
            this.predictedCorrect += 1;
          },
          });

        this.game.queueAction(action);
      },
      death: function (player, killer, deathType) {
        if(this.predictedVote == "*"){
          return;
        }
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.predictedCorrect += 1;
          if (this.game.IsBloodMoon && this.canDoSpecialInteractions()) {
            this.predictedCorrect = 2;
          }
          this.player.giveEffect("ExtraLife");
          this.player.queueAlert(
            `The Village has condemned ${this.predictedVote.name} to death, strengthening your bond with the spirit world. You gain an extra life.`
          );
        }
      },
      ElectedRoomLeader: function (leader, room, HasChanged) {
        if (!this.canDoSpecialInteractions()) {
          return;
        }
        if (leader === this.predictedVote && this.player.alive) {
          this.predictedCorrect += 1;
          this.player.giveEffect("ExtraLife");
          this.player.queueAlert(
            `Room ${room} has Elected ${this.predictedVote.name}, strengthening your bond with the spirit world. You gain an extra life.`
          );
        }
      },
    };
  }
};

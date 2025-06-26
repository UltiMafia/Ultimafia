const Card = require("../../Card");
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
      death: function (player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.predictedCorrect += 1;
          if (this.game.IsBloodMoon) {
            this.predictedCorrect = 2;
          }
          this.player.giveEffect("ExtraLife");
          this.player.queueAlert(
            `The Village has condemned ${this.predictedVote.name} to death, strengthening your bond with the spirit world. You gain an extra life.`
          );
        }
      },
      ElectedRoomLeader: function (leader, room, HasChanged) {
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

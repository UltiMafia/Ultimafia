const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class DivinerPrediction extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = false;
    
    this.meetings = {
      "Diviner Prediction": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          run: function () {
            this.actor.role.predictedVote = this.target;
          },
        },
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (aliveCount <= 1 && this.player.alive)
          winners.addPlayer(this.player, this.name);
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        if (!this.predictedCorrect) {
          delete this.predictedVote;
        }
      },
      death: function (player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.predictedCorrect = true;
          this.player.queueAlert(
            `The Village has condemned ${this.predictedVote.name} to death, allowing you to use your Divining Rod to find the orichalcum to empower your runestone.`
          );
        }
        if (
          player === this.player &&
          deathType === "condemn" &&
          this.predictedCorrect
        ) {
          const playerRoleName = this.player.getRoleAppearance("condemn");
          const playerLastWill = this.player.lastWill;
          this.player.role.appearance.condemn = null;
          this.player.lastWill = null;
          this.player.revive("basic", this.player);
          if (this.dominates()) this.predictedVote.kill("condemn", this.actor);
          this.player.role.appearance.condemn = playerRoleName;
          this.player.lastWill = playerLastWill;
          this.predictedCorrect = false;
        }
      },
    };
  }
};

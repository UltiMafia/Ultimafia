const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class DivinerPrediction extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = false;

    this.meetings = {
      "Diviner Prediction": {
        actionName: "Predict Condemnation Vote",
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
          this.player.removeEffect("ExtraLife");
          delete this.predictedVote;
        } else if (this.predictedCorrect) {
          this.player.giveEffect("ExtraLife");
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
      },
      immune: function (action) {
        if (action.target !== this.player) {
          return;
        }

        if (!action.hasLabel("kill")) {
          return;
        }

        let deathType = "basic";

        if (action.hasLabel("condemn")) {
          deathType = "condemn";
        }

        let killAction = new Action({
          labels: ["kill"],
          actor: this.player,
          target: this.player.role.predictedVote,
          game: this.player.game,
          run: function () {
            if (this.dominates()) {
              this.target.kill(deathType, this.actor);
            }
          },
        });
        killAction.do();
      },
    };
  }
};

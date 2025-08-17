const Card = require("../../Card");
const {
  PRIORITY_KILL_DEFAULT,
  PRIORITY_SUPPORT_VISIT_DEFAULT,
} = require("../../const/Priority");

module.exports = class RiskyPrediction extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = false;

    this.meetings = {
      "Bookie Prediction": {
        actionName: "Predict Condemnation Vote",
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {
            this.role.predictedVote = this.target;
          },
        },
      },
      "Bookie Kill": {
        actionName: "Bonus Kill",
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return this.predictedCorrect;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          role: this.role,
          run: function () {
            if (this.dominates()) {
              this.target.kill("basic", this.actor);
            }
            this.role.predictedCorrect = false;
          },
        },
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
          this.hasAbility(["Kill"])
        ) {
          this.predictedCorrect = true;
          this.player.queueAlert(
            `The Village has condemned ${this.predictedVote.name} to death, giving you a bonus kill.`
          );
        }
      },
      ElectedRoomLeader: function (leader, room, HasChanged) {
        if (leader === this.predictedVote && this.player.alive) {
          this.predictedCorrect = true;
          this.player.queueAlert(
            `Room ${room} has Elected ${this.predictedVote.name}, giving you a bonus kill.`
          );
        }
      },
    };
  }
};

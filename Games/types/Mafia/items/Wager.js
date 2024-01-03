const Item = require("../Item");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Wager extends Item {
  constructor(lifespan) {
    super("Wager");

    this.cannotBeStolen = true;
    this.lifespan = lifespan || Infinity;

    this.predictedCorrect = false;
    this.predictedVote = null;

    this.meetings = {
      "Wager Prediction": {
        actionName: "Predict Condemnation Vote",
        states: ["Night"],
        flags: ["voting"],
        action: {
          item: this,
          actor: this.holder,
          run: function () {
            this.actor.role.predictedVote = this.target;
          },
        },
      },
      "Wager Kill": {
        actionName: "Bonus Kill",
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return this.item.predictedCorrect;
        },
        action: {
          item: this,
          actor: this.holder,
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.holder.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        if (!this.item.predictedCorrect) {
          delete this.item.predictedVote;
        }
      },
      death: function (player, killer, deathType) {
        if (
          player === this.item.predictedVote &&
          deathType === "condemn" &&
          this.holder.alive
        ) {
          this.item.predictedCorrect = true;
          this.holder.queueAlert(
            `The Village has condemned ${this.item.predictedVote.name} to death, allowing you to gain a bonus kill.`
          );
        }
      },
    };
  }
};

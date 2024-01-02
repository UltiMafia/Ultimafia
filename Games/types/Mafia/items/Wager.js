const Item = require("../Item");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Wager extends Item {
  constructor(lifespan) {
    super("Wager");

    this.cannotBeStolen = true;
    this.lifespan = lifespan || Infinity;

    this.predictedCorrect = false;

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
          return this.predictedCorrect;
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
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        delete this.holder.role.predictedVote;
      },
      death: function (player, killer, deathType) {
        if (
          player === this.holder.role.predictedVote &&
          deathType === "condemn" &&
          this.holder.alive
        ) {
          this.predictedCorrect = true;
          this.holder.queueAlert(
            `The Village has condemned ${this.holder.role.predictedVote.name} to death, allowing you to use your Divining Rod to find the orichalcum to empower your runestone.`
          );
        }
      },
    };
  }
};

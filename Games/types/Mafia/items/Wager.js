const Item = require("../Item");

module.exports = class Wager extends Item {
  constructor(lifespan) {
    super("Wager");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Wager Guess": {
        states: ["Night"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          run: function () {
            this.holder.role.predictedVote = this.target;
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
        
        if (!this.holder.role.predictedCorrect) {
          delete this.holder.role.predictedVote;
        }
      },
      death: function (player, killer, deathType, instant) {
        if (
          player === this.holder.role.predictedVote &&
          deathType === "condemn" &&
          this.holder.alive
        ) {
          this.holder.role.predictedCorrect = true;
        }
      },
    };
  }
};

const Item = require("../Item");

module.exports = class Wager extends Item {
  constructor(options) {
    super("Wager");

    this.bookie = options?.bookie;

    this.lifespan = options?.lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Wager Guess": {
        states: ["Night"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          item: this,
          actor: this.bookie,
          run: function () {
            this.actor.role.predictedVote = this.target;
          },
        },
      },
    };
    this.listeners = {
      state: function (stateInfo) {
        if (!this.bookie.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        
        if (!this.bookie.role.predictedCorrect) {
          delete this.bookie.role.predictedVote;
        }
      },
      death: function (player, killer, deathType, instant) {
        if (
          player === this.bookie.role.predictedVote &&
          deathType === "condemn" &&
          this.bookie.alive
        ) {
          this.bookie.role.predictedCorrect = true;
        }
      },
    };
  }
};

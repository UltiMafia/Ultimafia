const Effect = require("../Effect");

module.exports = class Tree extends Effect {
  constructor(power, lifespan) {
    super("Tree");

    this.lifespan = lifespan ?? Infinity;
    this.immunity["condemn"] = power || 3;
    this.immunity["convert"] = 1;
    this.immunity["kill"] = 5;
    this.cancelImmunity["ignite"] = Infinity;
    this.cancelImmunity["bomb"] = Infinity;
  }
  apply(player) {
    super.apply(player);

    player.queueAlert(
      ":tree: You grow into a tree!"
    );

    player.role.meetings["*"].canVote = false;
  }
};

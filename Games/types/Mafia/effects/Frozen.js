const Effect = require("../Effect");

module.exports = class Frozen extends Effect {
  constructor(power, lifespan) {
    super("Frozen");
  }
  apply(player) {
    super.apply(player);

    player.role.meetings["*"].canVote = false;
  }
};

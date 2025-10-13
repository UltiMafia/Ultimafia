const Effect = require("../Effect");

module.exports = class Lovesick extends Effect {
  constructor(lover) {
    super("Lovesick");
    this.lover = lover;
    this.isMalicious = true;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.lover) {
          this.player.kill("love", this.lover, instant);
        }
      },
    };
  }
};

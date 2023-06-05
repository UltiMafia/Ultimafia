const Effect = require("../Effect");

module.exports = class InLoveWith extends Effect {
  constructor(lover) {
    super("In Love With");
    this.lover = lover;

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.lover) {
          this.player.kill("love", this.lover, instant);
        }
      },
    }
  }
};

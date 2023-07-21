const Effect = require("../Effect");

module.exports = class Immortal extends Effect {
  constructor(teaLady, goodNeighbor) {
    super("Immortal");

    this.teaLady = teaLady;
    this.goodNeighbor = goodNeighbor;

    this.immunity["kill"] = 5;
    this.immunity["lynch"] = 5;

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.teaLady) {
          this.remove();
        }
      },
      roleAssigned: function (player) {
        if (player == this.teaLady ||
          player == this.goodNeighbor) {
          this.remove();
        }
      }
    };
  }
};

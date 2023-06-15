const Role = require("../../Role");

module.exports = class TheThing extends Role {
  constructor(player, data) {
    super("The Thing", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "HuntPrey", "Oblivious"];
  }
};

const Role = require("../../Role");

module.exports = class Occultist extends Role {
  constructor(player, data) {
    super("Occultist", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WithWithCult", "Oblivious"];
  }
};

const Role = require("../../Role");

module.exports = class Chandler extends Role {
  constructor(player, data) {
    super("Chandler", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CandleGiver"];
  }
};

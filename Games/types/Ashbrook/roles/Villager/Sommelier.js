const Role = require("../../Role");

module.exports = class Sommelier extends Role {
  constructor(player, data) {
    super("Sommelier", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnEvilPairs"];
  }
};

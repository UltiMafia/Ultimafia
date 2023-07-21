const Role = require("../../Role");

module.exports = class Villager6 extends Role {
  constructor(player, data) {
    super("Villager6", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnEvilDeadCount"];
  }
};

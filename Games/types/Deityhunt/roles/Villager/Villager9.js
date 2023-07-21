const Role = require("../../Role");

module.exports = class Villager9 extends Role {
  constructor(player, data) {
    super("Villager9", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnParticularVillager"];
  }
};

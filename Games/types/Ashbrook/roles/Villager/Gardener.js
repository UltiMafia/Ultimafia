const Role = require("../../Role");

module.exports = class Gardener extends Role {
  constructor(player, data) {
    super("Gardener", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnParticularVillager"];
  }
};

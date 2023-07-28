const Role = require("../../Role");

module.exports = class Greenhorn extends Role {
  constructor(player, data) {
    super("Greenhorn", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnParticularOutcast"];
  }
};

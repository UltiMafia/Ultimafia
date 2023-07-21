const Role = require("../../Role");

module.exports = class Villager10 extends Role {
  constructor(player, data) {
    super("Villager10", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnParticularFollower"];
  }
};

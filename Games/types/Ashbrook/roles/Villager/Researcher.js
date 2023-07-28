const Role = require("../../Role");

module.exports = class Researcher extends Role {
  constructor(player, data) {
    super("Researcher", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnParticularFollower"];
  }
};

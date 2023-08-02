const Role = require("../../Role");

module.exports = class Runner extends Role {
  constructor(player, data) {
    super("Runner", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnLeaderFollowerSteps"];
  }
};

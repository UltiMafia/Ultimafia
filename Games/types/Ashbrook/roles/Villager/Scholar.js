const Role = require("../../Role");

module.exports = class Scholar extends Role {
  constructor(player, data) {
    super("Scholar", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnTwoNonLeader"];
  }
};

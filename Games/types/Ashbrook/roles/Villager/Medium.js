const Role = require("../../Role");

module.exports = class Medium extends Role {
  constructor(player, data) {
    super("Medium", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnEvilDeadCount"];
  }
};

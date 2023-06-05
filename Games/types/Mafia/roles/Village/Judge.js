const Role = require("../../Role");

module.exports = class Judge extends Role {
  constructor(player, data) {
    super("Judge", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "VoteWeightTwo"];
  }
};

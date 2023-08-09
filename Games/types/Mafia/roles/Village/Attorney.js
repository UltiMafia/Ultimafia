const Role = require("../../Role");

module.exports = class Attorney extends Role {
  constructor(player, data) {
    super("Attorney", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "VoteWeightTwo"];
  }
};

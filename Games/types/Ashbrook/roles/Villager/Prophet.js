const Role = require("../../Role");

module.exports = class Prophet extends Role {
  constructor(player, data) {
    super("Prophet", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LeaderInvestigate"];
  }
};

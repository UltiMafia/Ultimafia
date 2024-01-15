const Role = require("../../Role");

module.exports = class Emperor extends Role {
  constructor(player, data) {
    super("Emperor", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "ImperialDecree", "WinIfPrescientVote"];
  }
};

const Role = require("../../Role");

module.exports = class Sidekick extends Role {
  constructor(player, data) {
    super("Sidekick", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinWithIndependentLead"];
  }
};

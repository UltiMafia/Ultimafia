const Role = require("../../Role");

module.exports = class Palladist extends Role {
  constructor(player, data) {
    super("Palladist", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "MeetWithMasons", "ConvertImmune", "AnonymizeMasons", "WinWithMasonMajority"];
  }
};

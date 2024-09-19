const Role = require("../../Role");

module.exports = class Sheep extends Role {
  constructor(player, data) {
    super("Sheep", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "SacrificeSameRole"];
  }
};

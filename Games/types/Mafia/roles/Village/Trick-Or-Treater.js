const Role = require("../../Role");

module.exports = class TrickOrTreater extends Role {
  constructor(player, data) {
    super("Trick-Or-Treater", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AnnouceNeighborVisitors",
    ];
  }
};
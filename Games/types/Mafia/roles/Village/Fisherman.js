const Role = require("../../Role");

module.exports = class Fisherman extends Role {
  constructor(player, data) {
    super("Fisherman", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GiveFishingRod",
    ];
  }
};

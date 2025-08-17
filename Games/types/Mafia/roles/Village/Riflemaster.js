const Role = require("../../Role");

module.exports = class Riflemaster extends Role {
  constructor(player, data) {
    super("Riflemaster", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GiveRifle",
    ];
  }
};

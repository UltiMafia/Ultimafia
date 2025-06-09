const Role = require("../../Role");

module.exports = class Clairvoyant extends Role {
  constructor(player, data) {
    super("Clairvoyant", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Learn2NotRoles",
    ];
  }
};

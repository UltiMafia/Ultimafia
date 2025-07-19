const Role = require("../../Role");

module.exports = class Hermit extends Role {
  constructor(player, data) {
    super("Hermit", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "TenBanishedRoles",
    ];
  }
};

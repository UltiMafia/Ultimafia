const Role = require("../../Role");

module.exports = class VicePresident extends Role {
  constructor(player, data) {
    super("Vice President", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddCopyOfRole",
      "MustRoleShareWithVip",
    ];
  }
};

const Role = require("../../Role");

module.exports = class Trader extends Role {
  constructor(player, data) {
    super("Trader", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SwapRoles",
    ];
  }
};

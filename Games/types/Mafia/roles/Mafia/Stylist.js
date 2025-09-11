const Role = require("../../Role");

module.exports = class Stylist extends Role {
  constructor(player, data) {
    super("Stylist", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SwapTwoOtherRolesNoAlignment",
    ];
  }
};

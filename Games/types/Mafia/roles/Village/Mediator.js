const Role = require("../../Role");

module.exports = class Mediator extends Role {
  constructor(player, data) {
    super("Mediator", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SwapTwoOtherRoles",
    ];
  }
};

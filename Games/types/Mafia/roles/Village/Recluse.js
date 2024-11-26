const Role = require("../../Role");

module.exports = class Recluse extends Role {
  constructor(player, data) {
    super("Recluse", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MakeShyOnRoleShare",
    ];
  }
};

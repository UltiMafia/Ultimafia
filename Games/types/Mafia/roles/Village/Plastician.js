const Role = require("../../Role");

module.exports = class Plastician extends Role {
  constructor(player, data) {
    super("Plastician", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddRandomModifier",
    ];
  }
};

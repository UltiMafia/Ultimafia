const Role = require("../../Role");

module.exports = class Modder extends Role {
  constructor(player, data) {
    super("Modder", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddRandomModifier",
    ];
  }
};

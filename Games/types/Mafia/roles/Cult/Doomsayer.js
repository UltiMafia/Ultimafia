const Role = require("../../Role");

module.exports = class Doomsayer extends Role {
  constructor(player, data) {
    super("Doomsayer", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "ConvertVisitors",
      "KillCultistsOnDeath",
    ];
  }
};

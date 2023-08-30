const Role = require("../../Role");

module.exports = class CultLeader extends Role {
  constructor(player, data) {
    super("Cult Leader", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "ConvertToCultists",
      "KillCultistsOnDeath",
    ];
  }
};

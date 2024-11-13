const Role = require("../../Role");

module.exports = class Bomber extends Role {
  constructor(player, data) {
    super("Bomber", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ForceSplitDecision",
      "KillAllInRoom",
    ];
  }
};

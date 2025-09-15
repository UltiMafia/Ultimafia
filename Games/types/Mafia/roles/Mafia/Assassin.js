const Role = require("../../Role");

module.exports = class Assassin extends Role {
  constructor(player, data) {
    super("Assassin", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ForceSplitDecision",
      "KillAllInRoom",
      //"AddCopyOfRole",
      //"VillageWinsWhenKilled",
    ];
  }
};

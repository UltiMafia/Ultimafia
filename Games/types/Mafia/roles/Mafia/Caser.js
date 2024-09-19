const Role = require("../../Role");

module.exports = class Caser extends Role {
  constructor(player, data) {
    super("Caser", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "WatchPlayerRole",
    ];
  }
};

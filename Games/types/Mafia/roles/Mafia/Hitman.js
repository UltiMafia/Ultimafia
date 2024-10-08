const Role = require("../../Role");

module.exports = class Hitman extends Role {
  constructor(player, data) {
    super("Hitman", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "NightKiller",
    ];
  }
};

const Role = require("../../Role");

module.exports = class Ringleader extends Role {
  constructor(player, data) {
    super("Ringleader", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GiveFactionAbility",
    ];
  }
};

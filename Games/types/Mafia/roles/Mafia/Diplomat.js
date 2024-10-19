const Role = require("../../Role");

module.exports = class Diplomat extends Role {
  constructor(player, data) {
    super("Diplomat", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MakeCondemnImmune",
    ];
  }
};

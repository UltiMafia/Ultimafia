const Role = require("../../Role");

module.exports = class Sicario extends Role {
  constructor(player, data) {
    super("Sicario", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "DaySicario",
    ];
  }
};

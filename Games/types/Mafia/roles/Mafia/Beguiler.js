const Role = require("../../Role");

module.exports = class Beguiler extends Role {
  constructor(player, data) {
    super("Beguiler", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CreateFakeVisits",
    ];
  }
};

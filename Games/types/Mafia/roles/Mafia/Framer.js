const Role = require("../../Role");

module.exports = class Framer extends Role {
  constructor(player, data) {
    super("Framer", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CreateFakeVisits",
    ];
  }
};

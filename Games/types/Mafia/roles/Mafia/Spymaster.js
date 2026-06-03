const Role = require("../../Role");

module.exports = class Spymaster extends Role {
  constructor(player, data) {
    super("Spymaster", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "MissionGame",
    ];
  }
};

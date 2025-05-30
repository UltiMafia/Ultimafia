const Role = require("../../Role");

module.exports = class Lamia extends Role {
  constructor(player, data) {
    super("Lamia", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "KillAndDeliriumSurvivors",
    ];
  }
};

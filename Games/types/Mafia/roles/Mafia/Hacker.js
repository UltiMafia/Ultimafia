const Role = require("../../Role");

module.exports = class Hacker extends Role {
  constructor(player, data) {
    super("Hacker", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddRandomModifier",
    ];
  }
};

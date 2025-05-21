const Role = require("../../Role");

module.exports = class Tattooist extends Role {
  constructor(player, data) {
    super("Tattooist", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddRandomModifier",
    ];
  }
};

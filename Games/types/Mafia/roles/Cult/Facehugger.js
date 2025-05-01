const Role = require("../../Role");

module.exports = class Facehugger extends Role {
  constructor(player, data) {
    super("Facehugger", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ConvertToChosenRoleOnDeath",
    ];
  }
};

const Role = require("../../Role");

module.exports = class Incubus extends Role {
  constructor(player, data) {
    super("Incubus", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ConvertToChosenRoleOnDeath",
    ];
  }
};

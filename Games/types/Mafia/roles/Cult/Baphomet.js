const Role = require("../../Role");

module.exports = class Baphomet extends Role {
  constructor(player, data) {
    super("Baphomet", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddCopyOfRole",
      "MeetWithTemplars",
    ];
  }
};

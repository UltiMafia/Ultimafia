const Role = require("../../Role");

module.exports = class Skinwalker extends Role {
  constructor(player, data) {
    super("Skinwalker", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ImitateRole",
    ];
  }
};

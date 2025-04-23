const Role = require("../../Role");

module.exports = class Runemaster extends Role {
  constructor(player, data) {
    super("Runemaster", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CultWares",
    ];
  }
};

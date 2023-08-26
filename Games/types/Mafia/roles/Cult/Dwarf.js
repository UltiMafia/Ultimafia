const Role = require("../../Role");

module.exports = class Dwarf extends Role {
  constructor(player, data) {
    super("Dwarf", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "MagicGunGiver",
    ];
  }
};

const Role = require("../../Role");

module.exports = class Vizier extends Role {
  constructor(player, data) {
    super("Vizier", player, data);
    this.alignment = "Vizier";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "Coronation",
    ];
  }
};

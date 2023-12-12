const Role = require("../../Role");

module.exports = class Ninja extends Role {
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

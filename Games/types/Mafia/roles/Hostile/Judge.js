const Role = require("../../Role");

module.exports = class Judge extends Role {
  constructor(player, data) {
    super("Judge", player, data);
    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "WinAmongLastTwo",
      "CourtSession",
    ];
  }
};

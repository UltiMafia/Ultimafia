const Role = require("../../Role");

module.exports = class Siren extends Role {
  constructor(player, data) {
    super("Siren", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfBeckons", "KillBeckoned"];
  }
};

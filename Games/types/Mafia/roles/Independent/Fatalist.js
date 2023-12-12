const Role = require("../../Role");

module.exports = class Fatalist extends Role {
  constructor(player, data) {
    super("Fatalist", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "Prognosticate", "WinIfPredictOwnDeath"];
  }
};

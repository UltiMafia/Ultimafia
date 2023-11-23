const Role = require("../../Role");

module.exports = class Shinigami extends Role {
  constructor(player, data) {
    super("Shinigami", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinByGuessingKira"];
  }
};

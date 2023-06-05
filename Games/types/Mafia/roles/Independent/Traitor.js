const Role = require("../../Role");

module.exports = class Traitor extends Role {
  constructor(player, data) {
    super("Traitor", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinWithMafia", "Oblivious"];
  }
};

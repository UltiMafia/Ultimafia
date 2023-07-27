const Role = require("../../Role");

module.exports = class Chauffeur extends Role {
  constructor(player, data) {
    super("Chauffeur", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "SwapVisitors"];
  }
};

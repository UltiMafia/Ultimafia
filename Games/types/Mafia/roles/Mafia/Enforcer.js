const Role = require("../../Role");

module.exports = class Enforcer extends Role {
  constructor(player, data) {
    super("Enforcer", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "CureAllMadness"];
  }
};

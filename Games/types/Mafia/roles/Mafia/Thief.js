const Role = require("../../Role");

module.exports = class Thief extends Role {
  constructor(player, data) {
    super("Thief", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "StealItem"];
  }
};

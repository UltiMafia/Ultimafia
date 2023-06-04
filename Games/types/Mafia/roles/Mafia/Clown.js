const Role = require("../../Role");

module.exports = class Clown extends Role {
  constructor(player, data) {
    super("Clown", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "Oblivious", "ClownAround"];
  }
};

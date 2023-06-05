const Role = require("../../Role");

module.exports = class Blinder extends Role {
  constructor(player, data) {
    super("Blinder", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "Blinder"];
  }
};

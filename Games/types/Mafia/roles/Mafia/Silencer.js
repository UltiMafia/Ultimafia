const Role = require("../../Role");

module.exports = class Silencer extends Role {
  constructor(player, data) {
    super("Silencer", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "Silencer"];
  }
};

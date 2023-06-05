const Role = require("../../Role");

module.exports = class Percival extends Role {
  constructor(player, data) {
    super("Percival", player, data);

    this.alignment = "Resistance";
    this.cards = ["TeamCore", "WinWithResistance", "KnowMerlin"];
  }
};

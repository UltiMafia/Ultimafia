const Role = require("../../Role");

module.exports = class Isolde extends Role {
  constructor(player, data) {
    super("Isolde", player, data);

    this.alignment = "Resistance";
    this.cards = ["TeamCore", "WinWithResistance", "KnowTristan"];
  }
};

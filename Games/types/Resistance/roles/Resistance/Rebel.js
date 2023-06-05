const Role = require("../../Role");

module.exports = class Rebel extends Role {
  constructor(player, data) {
    super("Rebel", player, data);

    this.alignment = "Resistance";
    this.cards = ["TeamCore", "WinWithResistance"];
  }
};

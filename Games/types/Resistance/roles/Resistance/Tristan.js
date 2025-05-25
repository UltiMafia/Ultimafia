const Role = require("../../Role");

module.exports = class Tristan extends Role {
  constructor(player, data) {
    super("Tristan", player, data);

    this.alignment = "Resistance";
    this.appearance.isolde = "Tristan";
    this.cards = ["TeamCore", "WinWithResistance", "KnowIsolde", "Lovers"];
  }
};

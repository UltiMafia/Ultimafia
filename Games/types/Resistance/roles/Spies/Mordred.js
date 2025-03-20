const Role = require("../../Role");

module.exports = class Mordred extends Role {
  constructor(player, data) {
    super("Mordred", player, data);

    this.alignment = "Spies";
    this.cards = ["TeamCore", "WinWithSpies", "SpyCore"];
  }
};
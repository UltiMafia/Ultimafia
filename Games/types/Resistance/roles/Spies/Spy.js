const Role = require("../../Role");

module.exports = class Spy extends Role {
  constructor(player, data) {
    super("Spy", player, data);
    this.alignment = "Spies";
    this.cards = ["TeamCore", "WinWithSpies", "SpyCore"];
  }
};

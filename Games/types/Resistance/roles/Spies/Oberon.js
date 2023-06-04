const Role = require("../../Role");

module.exports = class Oberon extends Role {
  constructor(player, data) {
    super("Oberon", player, data);

    this.alignment = "Spies";
    this.cards = ["TeamCore", "WinWithSpies", "SpyCore", "Oblivious"];
  }
};

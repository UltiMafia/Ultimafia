const Role = require("../../Role");

module.exports = class Lunatic extends Role {
  constructor(player, data) {
    super("Lunatic", player, data);

    this.alignment = "Spies";
    this.cards = ["TeamCore", "WinWithSpies", "SpyCore"];
  }
};

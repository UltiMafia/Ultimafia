const Role = require("../../Role");

module.exports = class Morgana extends Role {
  constructor(player, data) {
    super("Morgana", player, data);

    this.alignment = "Spies";
    this.appearance.percival = "Merlin";
    this.cards = ["TeamCore", "WinWithSpies", "SpyCore"];
  }
};

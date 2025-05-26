const Role = require("../../Role");

module.exports = class Assassin extends Role {
  constructor(player, data) {
    super("Assassin", player, data);

    this.alignment = "Spies";
    this.cards = ["TeamCore", "WinWithSpies", "SpyCore", "AssassinGuess"];
  }
};

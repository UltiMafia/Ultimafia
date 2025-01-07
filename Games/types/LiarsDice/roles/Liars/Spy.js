const Role = require("../../Role");

module.exports = class Spy extends Role {
  constructor(player, data) {
    super("Spy", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "WinIfLastAlive"];
    this.startItems = ["Spying"];
  }
};

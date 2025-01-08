const Role = require("../../Role");

module.exports = class Suitress extends Role {
  constructor(player, data) {
    super("Suitress", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "WinIfLastAlive"];
    this.startItems = ["Propose"];
  }
};

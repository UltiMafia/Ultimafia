const Role = require("../../Role");

module.exports = class Grandmaster extends Role {
  constructor(player, data) {
    super("Grandmaster", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinIfCheckmate", "PlayChess"];
  }
};

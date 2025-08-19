const Role = require("../../Role");

module.exports = class Starman extends Role {
  constructor(player, data) {
    super("Starman", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinIfFourInARow", "PlayConnectFour"];
  }
};

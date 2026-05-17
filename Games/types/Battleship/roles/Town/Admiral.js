const Role = require("../../Role");

module.exports = class Admiral extends Role {
  constructor(player, data) {
    super("Admiral", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinIfAllShipsSunk"];
  }
};

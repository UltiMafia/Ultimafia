const Role = require("../../Role");

module.exports = class Steeplejack extends Role {
  constructor(player, data) {
    super("Steeplejack", player, data);
    this.alignment = "Town";
    this.cards = ["WinIfMostPoints", "TownCore", "ClaimMatch"];
  }
};

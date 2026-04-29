const Role = require("../../Role");

module.exports = class Towerer extends Role {
  constructor(player, data) {
    super("Towerer", player, data);
    this.alignment = "Town";
    this.cards = ["WinIfMostPoints", "TownCore", "ClaimMatch"];
  }
};

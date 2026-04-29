const Role = require("../../Role");

module.exports = class Weller extends Role {
  constructor(player, data) {
    super("Weller", player, data);
    this.alignment = "Town";
    this.cards = ["WinIfEmptyStack", "TownCore", "ClaimMatch"];
  }
};

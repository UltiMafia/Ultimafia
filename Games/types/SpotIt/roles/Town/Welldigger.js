const Role = require("../../Role");

module.exports = class Welldigger extends Role {
  constructor(player, data) {
    super("Welldigger", player, data);
    this.alignment = "Town";
    this.cards = ["WinIfEmptyStack", "TownCore", "ClaimMatch"];
  }
};

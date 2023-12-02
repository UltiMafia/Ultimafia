const Role = require("../../Role");

module.exports = class Neighbor extends Role {
  constructor(player, data) {
    super("Neighbor", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "ResponseGiver"];
  }
};

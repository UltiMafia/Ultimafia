const Role = require("../../Role");

module.exports = class Gambler extends Role {
  constructor(player, data) {
    super("Gambler", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "ResponseGiver"];
  }
};
